using System.Net;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Pluggy;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FinanceControl.Tests.Unit
{
    public class OpenFinanceSyncTests
    {
        private const int UserId = 1;
        private const string ItemId = "item-1";
        private const string CheckingId = "acc-checking";
        private const string CardId = "acc-card";

        private sealed class Harness
        {
            public required ApplicationDbContext Context { get; init; }
            public required FakePluggyHandler Pluggy { get; init; }
            public required OpenFinanceSyncService Sync { get; init; }
            public required Account Checking { get; init; }
            public required Account Card { get; init; }
            public required BankConnection Connection { get; init; }
            public required int OtherExpensesId { get; init; }
            public required int OtherIncomeId { get; init; }
            public required int GroceryId { get; init; }
        }

        private static async Task<Harness> CreateAsync(DateOnly? importFrom = null)
        {
            var context = DbContextHelper.CreateInMemory();
            var pluggy = new FakePluggyHandler();

            var client = new PluggyClient(
                new HttpClient(pluggy) { BaseAddress = new Uri("https://api.pluggy.test/") },
                Options.Create(new PluggySettings { ClientId = "id", ClientSecret = "secret" }),
                new PluggyApiKeyCache(),
                NullLogger<PluggyClient>.Instance);

            var claude = new ClaudeClient(Options.Create(new AnthropicSettings()), NullLogger<ClaudeClient>.Instance);
            var categorizer = new ImportCategorizer(
                context, claude, new AiAccessPolicy(context, claude),
                Options.Create(new AnthropicSettings()), NullLogger<ImportCategorizer>.Instance);

            var investments = new OpenFinanceInvestmentSyncService(context, client, NullLogger<OpenFinanceInvestmentSyncService>.Instance);
            var sync = new OpenFinanceSyncService(
                context, client, categorizer, investments,
                Options.Create(new OpenFinanceSettings { Enabled = true, SyncWindowDays = 10 }),
                NullLogger<OpenFinanceSyncService>.Instance);

            context.Users.Add(new User { Id = UserId, Email = "u@test.com", Name = "U", PasswordHash = "x", ExternalRef = Guid.NewGuid() });

            var expenses = new Category { UserId = UserId, Name = "Outros" };
            var food = new Category { UserId = UserId, Name = "Alimentação" };
            var income = new Category { UserId = UserId, Name = "Outras receitas" };
            context.Categories.AddRange(expenses, food, income);
            await context.SaveChangesAsync();

            var otherExpenses = new SubCategory { UserId = UserId, CategoryId = expenses.Id, Name = "Outros gastos" };
            var grocery = new SubCategory { UserId = UserId, CategoryId = food.Id, Name = "Supermercado" };
            var otherIncome = new SubCategory { UserId = UserId, CategoryId = income.Id, Name = "Outras receitas" };
            context.SubCategories.AddRange(otherExpenses, grocery, otherIncome);

            var checking = new Account { UserId = UserId, Name = "Conta", Type = EnumAccountType.Checking };
            var card = new Account { UserId = UserId, Name = "Cartão", Type = EnumAccountType.Credit };
            context.Accounts.AddRange(checking, card);
            await context.SaveChangesAsync();

            var from = importFrom ?? new DateOnly(2026, 9, 1);
            var connection = new BankConnection
            {
                UserId = UserId,
                ItemId = ItemId,
                ConnectorName = "Banco Teste",
                Status = EnumBankConnectionStatus.Active,
                Accounts =
                [
                    new BankConnectionAccount
                    {
                        UserId = UserId, ExternalAccountId = CheckingId, ExternalType = "BANK",
                        ExternalSubtype = "CHECKING_ACCOUNT", Name = "Conta", AccountId = checking.Id,
                        Status = EnumBankAccountLinkStatus.Linked, ImportFromDate = from
                    },
                    new BankConnectionAccount
                    {
                        UserId = UserId, ExternalAccountId = CardId, ExternalType = "CREDIT",
                        ExternalSubtype = "CREDIT_CARD", Name = "Cartão", AccountId = card.Id,
                        Status = EnumBankAccountLinkStatus.Linked, ImportFromDate = from
                    }
                ]
            };
            context.BankConnections.Add(connection);
            await context.SaveChangesAsync();

            pluggy.On(HttpMethod.Get, $"items/{ItemId}", HttpStatusCode.OK, new
            {
                id = ItemId,
                status = "UPDATED",
                executionStatus = "SUCCESS",
                clientUserId = "x",
                connector = new { id = 601, name = "Banco Teste", isOpenFinance = true }
            });
            pluggy.On(HttpMethod.Get, "accounts", HttpStatusCode.OK, new
            {
                results = new object[]
                {
                    new { id = CheckingId, itemId = ItemId, type = "BANK", subtype = "CHECKING_ACCOUNT", name = "Conta", balance = 1500.25m },
                    new { id = CardId, itemId = ItemId, type = "CREDIT", subtype = "CREDIT_CARD", name = "Cartão", balance = 300m,
                          creditData = new { creditLimit = 5000m } }
                },
                page = 1, totalPages = 1, total = 2
            });

            return new Harness
            {
                Context = context, Pluggy = pluggy, Sync = sync, Checking = checking, Card = card, Connection = connection,
                OtherExpensesId = otherExpenses.Id, OtherIncomeId = otherIncome.Id, GroceryId = grocery.Id
            };
        }

        private static object Tx(string id, decimal amount, string date, string? type = null, string description = "COMPRA",
            string status = "POSTED", string? category = null, string? operationType = null, object? creditCardMetadata = null) => new
        {
            id,
            description,
            amount,
            date = $"{date}T00:00:00.000Z",
            type,
            status,
            category,
            operationType,
            creditCardMetadata
        };

        private static Task SyncAsync(Harness h) =>
            h.Sync.ApplyEventAsync("item/updated", new PluggyWebhookPayload { ItemId = ItemId }, CancellationToken.None);

        private static Task<List<Transaction>> SyncedAsync(Harness h) =>
            h.Context.Transactions.Where(t => t.ExternalId != null || t.Source == EnumTransactionSource.OpenFinance)
                .OrderBy(t => t.TransactionDate).ThenBy(t => t.Id).ToListAsync();

        [Fact]
        public async Task InitialImport_CreatesPostedRowsFromStartDate_InCentsWithDirection()
        {
            var h = await CreateAsync();
            h.Pluggy.Transactions[CheckingId] =
            [
                Tx("t1", -45.9m, "2026-09-05", "DEBIT", "MERCADO"),
                Tx("t2", 3000m, "2026-09-06", "CREDIT", "SALARIO"),
                Tx("t3", -10m, "2026-09-07", "DEBIT", "PENDENTE", status: "PENDING"),
                Tx("t4", -99m, "2026-08-20", "DEBIT", "ANTES DO INICIO")
            ];

            await SyncAsync(h);

            var rows = await SyncedAsync(h);
            Assert.Equal(2, rows.Count);
            Assert.Equal(("t1", 4590, EnumTransactionType.Expense), (rows[0].ExternalId, rows[0].Value, rows[0].Type));
            Assert.Equal(("t2", 300000, EnumTransactionType.Income), (rows[1].ExternalId, rows[1].Value, rows[1].Type));
            Assert.All(rows, r =>
            {
                Assert.Equal(EnumTransactionSource.OpenFinance, r.Source);
                Assert.True(r.NeedsReview);
                Assert.Equal(EnumPaymentMethod.Debit, r.PaymentMethod);
            });
            Assert.Equal(h.OtherExpensesId, rows[0].SubCategoryId);
            Assert.Equal(h.OtherIncomeId, rows[1].SubCategoryId);

            var link = await h.Context.BankConnectionAccounts.FirstAsync(a => a.ExternalAccountId == CheckingId);
            Assert.NotNull(link.InitialImportCompletedAt);
            Assert.Equal(150025, link.ExternalBalance);
        }

        [Fact]
        public async Task Resync_DoesNotDuplicate_UpdatesUntouchedRows_AndKeepsEditedOnes()
        {
            var h = await CreateAsync(importFrom: DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-5));
            var day = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-2).ToString("yyyy-MM-dd");
            h.Pluggy.Transactions[CheckingId] =
            [
                Tx("t1", -10m, day, "DEBIT", "PADARIA"),
                Tx("t2", -20m, day, "DEBIT", "FARMACIA")
            ];
            await SyncAsync(h);

            var edited = await h.Context.Transactions.FirstAsync(t => t.ExternalId == "t2");
            edited.Description = "Remédio";
            edited.ExternalModified = true;
            await h.Context.SaveChangesAsync();

            h.Pluggy.Transactions[CheckingId] =
            [
                Tx("t1", -12m, day, "DEBIT", "PADARIA CORRIGIDA"),
                Tx("t2", -25m, day, "DEBIT", "FARMACIA")
            ];
            await SyncAsync(h);

            var rows = await SyncedAsync(h);
            Assert.Equal(2, rows.Count);
            var t1 = rows.Single(r => r.ExternalId == "t1");
            Assert.Equal((1200, "PADARIA CORRIGIDA"), (t1.Value, t1.Description));
            var t2 = rows.Single(r => r.ExternalId == "t2");
            Assert.Equal((2000, "Remédio"), (t2.Value, t2.Description));
        }

        [Fact]
        public async Task DeletedByUser_IsNotRecreated()
        {
            var h = await CreateAsync();
            h.Context.IgnoredExternalTransactions.Add(new IgnoredExternalTransaction { UserId = UserId, ExternalId = "t1" });
            await h.Context.SaveChangesAsync();
            h.Pluggy.Transactions[CheckingId] = [Tx("t1", -10m, "2026-09-05", "DEBIT")];

            await SyncAsync(h);

            Assert.Empty(await SyncedAsync(h));
        }

        [Fact]
        public async Task SingleHandTypedMatch_TakesTheBankId_InsteadOfANewRow()
        {
            var h = await CreateAsync();
            h.Context.Transactions.Add(new Transaction
            {
                UserId = UserId, AccountId = h.Checking.Id, SubCategoryId = h.GroceryId, Value = 4590,
                Type = EnumTransactionType.Expense, Description = "Mercado do mês",
                TransactionDate = new DateOnly(2026, 9, 4), PaymentType = EnumPaymentType.OneTime
            });
            await h.Context.SaveChangesAsync();
            h.Pluggy.Transactions[CheckingId] = [Tx("t1", -45.9m, "2026-09-05", "DEBIT", "MERCADO")];

            await SyncAsync(h);

            var all = await h.Context.Transactions.ToListAsync();
            var row = Assert.Single(all);
            Assert.Equal("t1", row.ExternalId);
            Assert.Equal("Mercado do mês", row.Description);
            Assert.Equal(EnumTransactionSource.Manual, row.Source);
        }

        [Fact]
        public async Task TwoHandTypedMatches_CreateARowFlaggedAsPossibleDuplicate()
        {
            var h = await CreateAsync();
            foreach (var day in new[] { 4, 6 })
                h.Context.Transactions.Add(new Transaction
                {
                    UserId = UserId, AccountId = h.Checking.Id, SubCategoryId = h.GroceryId, Value = 1000,
                    Type = EnumTransactionType.Expense, Description = "Café",
                    TransactionDate = new DateOnly(2026, 9, day), PaymentType = EnumPaymentType.OneTime
                });
            await h.Context.SaveChangesAsync();
            h.Pluggy.Transactions[CheckingId] = [Tx("t1", -10m, "2026-09-05", "DEBIT", "CAFE")];

            await SyncAsync(h);

            var created = Assert.Single(await h.Context.Transactions.Where(t => t.Source == EnumTransactionSource.OpenFinance).ToListAsync());
            Assert.True(created.PossibleDuplicate);
            Assert.Equal(2, await h.Context.Transactions.CountAsync(t => t.ExternalId == null));
        }

        [Fact]
        public async Task CardPurchase_IsCreditExpense_WithInstallmentLinkedToTheFirst()
        {
            var h = await CreateAsync();
            h.Pluggy.Transactions[CardId] =
            [
                Tx("c1", 100m, "2026-09-05", description: "LOJA X", creditCardMetadata: new { installmentNumber = 1, totalInstallments = 3 }),
                Tx("c2", 100m, "2026-10-05", description: "LOJA X", creditCardMetadata: new { installmentNumber = 2, totalInstallments = 3 }),
                Tx("c3", -30m, "2026-09-10", description: "ESTORNO")
            ];

            await SyncAsync(h);

            var rows = await h.Context.Transactions.Where(t => t.AccountId == h.Card.Id).ToListAsync();
            var first = rows.Single(r => r.ExternalId == "c1");
            var second = rows.Single(r => r.ExternalId == "c2");
            var refund = rows.Single(r => r.ExternalId == "c3");

            Assert.Equal((EnumTransactionType.Expense, EnumPaymentMethod.Credit, EnumPaymentType.Installment),
                (first.Type, first.PaymentMethod!.Value, first.PaymentType));
            Assert.Equal((2, 3), (second.InstallmentNumber, second.TotalInstallments));
            Assert.Equal(first.Id, second.ParentTransactionId);
            Assert.Equal(EnumTransactionType.Income, refund.Type);
        }

        [Fact]
        public async Task BillPayment_SeenOnBothConnectedAccounts_BecomesOneTransfer()
        {
            var h = await CreateAsync();
            h.Pluggy.Transactions[CheckingId] = [Tx("p1", -500m, "2026-09-10", "DEBIT", "PAGAMENTO FATURA CARTAO")];
            h.Pluggy.Transactions[CardId] = [Tx("p2", -500m, "2026-09-11", description: "PAGAMENTO RECEBIDO", operationType: "PAGAMENTO_FATURA")];

            await SyncAsync(h);

            var transfer = Assert.Single(await h.Context.Transactions.ToListAsync());
            Assert.Equal(EnumTransactionType.Transfer, transfer.Type);
            Assert.Equal(h.Checking.Id, transfer.AccountId);
            Assert.Equal(h.Card.Id, transfer.DestinationAccountId);
            Assert.Equal(("p1", "p2"), (transfer.ExternalId, transfer.ExternalCounterpartId));

            // The next sync sees both ids again and must not resurrect the folded leg.
            await SyncAsync(h);
            Assert.Single(await h.Context.Transactions.ToListAsync());
        }

        [Fact]
        public async Task PluggyCategory_FillsTheDefaultSubCategory_WhenHistoryHasNothing()
        {
            var h = await CreateAsync();
            h.Pluggy.Transactions[CheckingId] = [Tx("t1", -80m, "2026-09-05", "DEBIT", "XYZ COMERCIO", category: "Groceries")];

            await SyncAsync(h);

            Assert.Equal(h.GroceryId, (await SyncedAsync(h)).Single().SubCategoryId);
        }

        [Fact]
        public async Task DeletedAtPluggy_RemovesUntouchedRows_AndUnlinksEditedOnes()
        {
            var h = await CreateAsync();
            h.Pluggy.Transactions[CheckingId] =
            [
                Tx("t1", -10m, "2026-09-05", "DEBIT", "A"),
                Tx("t2", -20m, "2026-09-06", "DEBIT", "B")
            ];
            await SyncAsync(h);
            var edited = await h.Context.Transactions.FirstAsync(t => t.ExternalId == "t2");
            edited.ExternalModified = true;
            await h.Context.SaveChangesAsync();

            await h.Sync.ApplyEventAsync("transactions/deleted",
                new PluggyWebhookPayload { ItemId = ItemId, AccountId = CheckingId, TransactionIds = ["t1", "t2"] },
                CancellationToken.None);

            var remaining = Assert.Single(await h.Context.Transactions.ToListAsync());
            Assert.Equal(edited.Id, remaining.Id);
            Assert.Null(remaining.ExternalId);
        }

        [Fact]
        public async Task ItemCreatedByWebhook_ForAKnownUser_CreatesTheConnectionWithPendingAccounts()
        {
            var h = await CreateAsync();
            var user = await h.Context.Users.FirstAsync();
            h.Pluggy.On(HttpMethod.Get, "items/item-2", HttpStatusCode.OK, new
            {
                id = "item-2",
                status = "UPDATED",
                executionStatus = "SUCCESS",
                clientUserId = user.ExternalRef.ToString(),
                connector = new { id = 602, name = "Outro Banco", isOpenFinance = true }
            });

            await h.Sync.ApplyEventAsync("item/created", new PluggyWebhookPayload { ItemId = "item-2" }, CancellationToken.None);

            var connection = await h.Context.BankConnections.Include(c => c.Accounts).FirstAsync(c => c.ItemId == "item-2");
            Assert.Equal((UserId, "Outro Banco", EnumBankConnectionStatus.Active), (connection.UserId, connection.ConnectorName, connection.Status));
            Assert.All(connection.Accounts, a => Assert.Equal(EnumBankAccountLinkStatus.PendingLink, a.Status));
            Assert.Equal(0, await h.Context.Transactions.CountAsync());
        }

        [Fact]
        public async Task ItemCreatedByWebhook_ForAnUnknownUser_IsIgnored()
        {
            var h = await CreateAsync();
            h.Pluggy.On(HttpMethod.Get, "items/item-3", HttpStatusCode.OK, new
            {
                id = "item-3", status = "UPDATED", clientUserId = Guid.NewGuid().ToString()
            });

            await h.Sync.ApplyEventAsync("item/created", new PluggyWebhookPayload { ItemId = "item-3" }, CancellationToken.None);

            Assert.False(await h.Context.BankConnections.AnyAsync(c => c.ItemId == "item-3"));
        }

        private static void ServeInvestments(Harness h, params object[] positions) =>
            h.Pluggy.On(HttpMethod.Get, "investments", HttpStatusCode.OK,
                new { results = positions, page = 1, totalPages = 1, total = positions.Length });

        private static object Position(string id, string type, string? subtype, decimal balance, decimal? amountOriginal = null,
            decimal? quantity = null, string? code = null, string status = "ACTIVE", decimal? value = null) => new
        {
            id,
            name = code ?? $"Posição {id}",
            code,
            type,
            subtype,
            balance,
            amount = balance,
            amountOriginal,
            quantity,
            value,
            status,
            issueDate = "2026-01-10T00:00:00.000Z"
        };

        [Fact]
        public async Task Investments_FixedIncome_BecomesAPrivateOneUnitPosition_PricedByTheBank()
        {
            var h = await CreateAsync();
            ServeInvestments(h, Position("cdb-1", "FIXED_INCOME", "CDB", balance: 1100m, amountOriginal: 1000m, quantity: 1000m));

            await SyncAsync(h);

            var investment = await h.Context.Investments.Include(i => i.MarketAsset).Include(i => i.Transactions).SingleAsync();
            Assert.Equal(UserId, investment.MarketAsset.OwnerUserId);
            Assert.StartsWith(OpenFinanceInvestmentSyncService.PrivateTickerPrefix, investment.MarketAsset.Ticker);
            Assert.Equal(EnumAssetType.RendaFixa, investment.MarketAsset.AssetType);
            Assert.Equal((1m, 100000L, 110000L), (investment.CurrentQuantity, investment.AveragePrice, investment.MarketAsset.CurrentPrice));
            Assert.Equal(h.Checking.Id, investment.AccountId);
            var purchase = Assert.Single(investment.Transactions);
            Assert.Equal((EnumInvestmentOperation.Buy, 100000L), (purchase.Operation, purchase.TotalValue));

            // A new contribution and the yield: the bank's figures win, still one purchase.
            ServeInvestments(h, Position("cdb-1", "FIXED_INCOME", "CDB", balance: 1700m, amountOriginal: 1500m, quantity: 1500m));
            await SyncAsync(h);

            investment = await h.Context.Investments.Include(i => i.MarketAsset).Include(i => i.Transactions).SingleAsync();
            Assert.Equal((150000L, 170000L), (investment.AveragePrice, investment.MarketAsset.CurrentPrice));
            Assert.Equal(150000L, Assert.Single(investment.Transactions).TotalValue);
        }

        [Fact]
        public async Task Investments_ListedAsset_FollowsTheQuantity_AndRedemptionSellsEverything()
        {
            var h = await CreateAsync();
            ServeInvestments(h, Position("eq-1", "EQUITY", "STOCK", balance: 3800m, amountOriginal: 3000m, quantity: 100m, code: "PETR4", value: 38m));
            await SyncAsync(h);

            var investment = await h.Context.Investments.Include(i => i.MarketAsset).SingleAsync();
            Assert.Null(investment.MarketAsset.OwnerUserId);
            Assert.Equal(("PETR4", 100m, 3000L), (investment.MarketAsset.Ticker, investment.CurrentQuantity, investment.AveragePrice));

            ServeInvestments(h, Position("eq-1", "EQUITY", "STOCK", balance: 5700m, amountOriginal: 4800m, quantity: 150m, code: "PETR4", value: 38m));
            await SyncAsync(h);
            investment = await h.Context.Investments.Include(i => i.Transactions).SingleAsync();
            Assert.Equal(150m, investment.CurrentQuantity);
            var bought = investment.Transactions.OrderBy(t => t.Id).Last();
            Assert.Equal((EnumInvestmentOperation.Buy, 50m, 3600L), (bought.Operation, bought.Quantity, bought.UnitPrice));

            ServeInvestments(h, Position("eq-1", "EQUITY", "STOCK", balance: 0m, quantity: 0m, code: "PETR4", status: "TOTAL_WITHDRAWAL"));
            await SyncAsync(h);
            investment = await h.Context.Investments.Include(i => i.Transactions).SingleAsync();
            Assert.Equal(0m, investment.CurrentQuantity);
            Assert.Equal(EnumInvestmentOperation.Sell, investment.Transactions.OrderBy(t => t.Id).Last().Operation);
            Assert.Equal(EnumBankInvestmentLinkStatus.Closed, (await h.Context.BankConnectionInvestments.SingleAsync()).Status);
        }

        [Fact]
        public async Task Investments_AssetAlreadyTrackedByHand_IsLeftAlone()
        {
            var h = await CreateAsync();
            var asset = new MarketAsset { Ticker = "BOVA11", Name = "BOVA11", AssetType = EnumAssetType.ETF, CurrentPrice = 12000 };
            h.Context.MarketAssets.Add(asset);
            await h.Context.SaveChangesAsync();
            h.Context.Investments.Add(new Investment
            {
                UserId = UserId, MarketAssetId = asset.Id, CurrentQuantity = 10, AveragePrice = 11000, AccountId = h.Checking.Id
            });
            await h.Context.SaveChangesAsync();
            ServeInvestments(h, Position("etf-1", "ETF", null, balance: 6000m, quantity: 50m, code: "BOVA11", value: 120m));

            await SyncAsync(h);

            var investment = await h.Context.Investments.SingleAsync();
            Assert.Equal((10m, 11000L), (investment.CurrentQuantity, investment.AveragePrice));
            Assert.Equal(EnumBankInvestmentLinkStatus.MatchedExisting, (await h.Context.BankConnectionInvestments.SingleAsync()).Status);
        }

        [Fact]
        public async Task Investments_DeletedByTheUser_AreNotBroughtBack()
        {
            var h = await CreateAsync();
            ServeInvestments(h, Position("cdb-1", "FIXED_INCOME", "CDB", balance: 1100m, amountOriginal: 1000m));
            await SyncAsync(h);

            var link = await h.Context.BankConnectionInvestments.SingleAsync();
            h.Context.Investments.Remove(await h.Context.Investments.SingleAsync());
            link.InvestmentId = null;
            await h.Context.SaveChangesAsync();

            await SyncAsync(h);

            Assert.Empty(await h.Context.Investments.ToListAsync());
            Assert.Equal(EnumBankInvestmentLinkStatus.Dismissed, (await h.Context.BankConnectionInvestments.SingleAsync()).Status);
        }

        [Fact]
        public async Task Investments_WaitUntilTheAccountsAreSetUp()
        {
            var h = await CreateAsync();
            var pending = await h.Context.BankConnectionAccounts.FirstAsync();
            pending.Status = EnumBankAccountLinkStatus.PendingLink;
            await h.Context.SaveChangesAsync();
            ServeInvestments(h, Position("cdb-1", "FIXED_INCOME", "CDB", balance: 1100m));

            await SyncAsync(h);

            Assert.Empty(await h.Context.Investments.ToListAsync());
        }

        [Theory]
        [InlineData("FIXED_INCOME", "TREASURY", EnumAssetType.TesouroDireto)]
        [InlineData("FIXED_INCOME", "LCI", EnumAssetType.RendaFixa)]
        [InlineData("MUTUAL_FUND", "REAL_ESTATE_FUND", EnumAssetType.FII)]
        [InlineData("MUTUAL_FUND", "STOCK_FUND", EnumAssetType.FundoInvestimento)]
        [InlineData("EQUITY", "BDR", EnumAssetType.BDR)]
        [InlineData("SECURITY", "PGBL", EnumAssetType.Outro)]
        public void Investments_TypeMapping(string type, string subtype, EnumAssetType expected) =>
            Assert.Equal(expected, OpenFinanceInvestmentSyncService.MapAssetType(new PluggyInvestment { Type = type, Subtype = subtype }));

        [Theory]
        [InlineData("UPDATED", "SUCCESS", EnumBankConnectionStatus.Active)]
        [InlineData("UPDATED", "PARTIAL_SUCCESS", EnumBankConnectionStatus.PartiallyUpdated)]
        [InlineData("UPDATING", null, EnumBankConnectionStatus.Syncing)]
        [InlineData("LOGIN_ERROR", "INVALID_CREDENTIALS", EnumBankConnectionStatus.NeedsReconnect)]
        [InlineData("OUTDATED", "USER_AUTHORIZATION_REVOKED", EnumBankConnectionStatus.NeedsReconnect)]
        [InlineData("OUTDATED", "USER_AUTHORIZATION_PENDING", EnumBankConnectionStatus.WaitingUser)]
        [InlineData("OUTDATED", "SITE_NOT_AVAILABLE", EnumBankConnectionStatus.Outdated)]
        [InlineData("WAITING_USER_INPUT", null, EnumBankConnectionStatus.WaitingUser)]
        public void StatusMapper_ReadsExecutionStatusBeforeStatus(string status, string? execution, EnumBankConnectionStatus expected)
        {
            var item = new PluggyItem { Status = status, ExecutionStatus = execution };
            Assert.Equal(expected, PluggyStatusMapper.Map(item, DateTime.UtcNow));
        }

        [Fact]
        public void StatusMapper_ExpiredConsent_NeedsReconnect()
        {
            var item = new PluggyItem { Status = "UPDATED", ExecutionStatus = "SUCCESS", ConsentExpiresAt = DateTime.UtcNow.AddDays(-1) };
            Assert.Equal(EnumBankConnectionStatus.NeedsReconnect, PluggyStatusMapper.Map(item, DateTime.UtcNow));
        }

        [Theory]
        [InlineData("Food delivery", "delivery")]
        [InlineData("Groceries", "grocery")]
        [InlineData("Gas stations", "fuel")]
        [InlineData("Car rental", null)]
        [InlineData("TV", "cableTV")]
        [InlineData(null, null)]
        public void CategoryMap_MatchesWholeWords_SpecificBeforeBroad(string? category, string? expected) =>
            Assert.Equal(expected, PluggyCategoryMap.Resolve(category));
    }
}
