using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// Net worth is everything the user owns: cash across their accounts plus what the
    /// portfolio is worth. Two things used to be missing from that sum.
    /// <para>
    /// Transfers were dropped entirely — only income and expense were summed — so paying a
    /// credit-card invoice neither cleared the card nor debited the account that paid it.
    /// The grand total survived, because the two halves cancel, but every per-account
    /// balance drifted further from reality each month, and the assets/liabilities split
    /// the chart draws from those balances drifted with it.
    /// </para>
    /// <para>
    /// Investments were not counted at all, so a portfolio was money the user owned that the
    /// patrimony screen refused to show.
    /// </para>
    /// </summary>
    public class NetWorthEvolutionTests
    {
        private const int Month = 6;
        private const int Year = 2026;

        private static readonly DateOnly Start = new(Year, Month, 1);
        private static readonly DateOnly Finish = new(Year, Month, 30);

        private sealed record Fixture(AnalyticsService Service, int UserId, int Checking, int Card);

        private static Fixture Setup(Action<ApplicationDbContext, int, int, int> seedData)
        {
            var dbName = Guid.NewGuid().ToString();

            using (var seed = DbContextHelper.CreateInMemory(dbName))
            {
                var user = new User { Email = "nw@test.com", Name = "Test", PasswordHash = "x" };
                seed.Users.Add(user);
                seed.SaveChanges();

                var checking = new Account { UserId = user.Id, Name = "Corrente", Type = EnumAccountType.Checking };
                var card = new Account { UserId = user.Id, Name = "Cartao", Type = EnumAccountType.Credit };
                seed.Accounts.AddRange(checking, card);
                seed.SaveChanges();

                seedData(seed, user.Id, checking.Id, card.Id);
                seed.SaveChanges();

                var factory = new Mock<IDbContextFactory<ApplicationDbContext>>();
                factory.Setup(f => f.CreateDbContext()).Returns(() => DbContextHelper.CreateInMemory(dbName));
                factory.Setup(f => f.CreateDbContextAsync(default))
                    .ReturnsAsync(() => DbContextHelper.CreateInMemory(dbName));

                return new Fixture(
                    new AnalyticsService(factory.Object, Mock.Of<IHttpClientFactory>()),
                    user.Id, checking.Id, card.Id);
            }
        }

        private static Transaction Movement(int userId, int accountId, EnumTransactionType type, int value, int day) =>
            new()
            {
                UserId = userId,
                AccountId = accountId,
                Type = type,
                Value = value,
                TransactionDate = new DateOnly(Year, Month, day),
                PaymentType = EnumPaymentType.OneTime,
                Description = type.ToString(),
            };

        private static Task<List<Shared.Dtos.Response.Analytics.NetWorthEvolutionItemDto>> RunAsync(Fixture f) =>
            f.Service.GetNetWorthEvolutionAsync(new AnalyticsRequestDto
            {
                UserId = f.UserId,
                StartDate = Start,
                FinishDate = Finish,
            });

        [Fact]
        public async Task PayingACardInvoice_ClearsTheCardAndDebitsTheAccountThatPaid()
        {
            // Salary in, 300 spent on the card, then the invoice paid off in full.
            var fixture = Setup((db, userId, checking, card) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));
                db.Transactions.Add(Movement(userId, card, EnumTransactionType.Expense, 300, 5));

                var payment = Movement(userId, checking, EnumTransactionType.Transfer, 300, 20);
                payment.DestinationAccountId = card;
                db.Transactions.Add(payment);
            });

            var point = Assert.Single(await RunAsync(fixture));

            var checkingBalance = point.Breakdown.Single(b => b.AccountId == fixture.Checking).Balance;
            var cardBalance = point.Breakdown.Single(b => b.AccountId == fixture.Card).Balance;

            // The card is square and the account is down by what it paid.
            Assert.Equal(0, cardBalance);
            Assert.Equal(700, checkingBalance);
            Assert.Equal(700, point.NetWorth);
        }

        [Fact]
        public async Task MovingMoneyBetweenOwnAccounts_LeavesNetWorthUnchanged()
        {
            var fixture = Setup((db, userId, checking, card) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));

                var moved = Movement(userId, checking, EnumTransactionType.Transfer, 400, 10);
                moved.DestinationAccountId = card;
                db.Transactions.Add(moved);
            });

            var point = Assert.Single(await RunAsync(fixture));

            Assert.Equal(600, point.Breakdown.Single(b => b.AccountId == fixture.Checking).Balance);
            Assert.Equal(400, point.Breakdown.Single(b => b.AccountId == fixture.Card).Balance);
            // A transfer moves money, it does not create or destroy any.
            Assert.Equal(1_000, point.NetWorth);
        }

        [Fact]
        public async Task AnUnpaidInvoice_StaysNegativeSoItReadsAsALiability()
        {
            var fixture = Setup((db, userId, checking, card) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));
                db.Transactions.Add(Movement(userId, card, EnumTransactionType.Expense, 250, 5));
            });

            var point = Assert.Single(await RunAsync(fixture));

            Assert.Equal(-250, point.Breakdown.Single(b => b.AccountId == fixture.Card).Balance);
            Assert.Equal(750, point.NetWorth);
        }

        [Fact]
        public async Task MoneyParkedInAnItemGoal_StillCountsAsTheUsersOwn()
        {
            // Item goals keep their money in a virtual IsSystem account, funded by a transfer
            // out of a real one. Excluding those accounts would delete the money outright:
            // the funding account is already debited, so the destination has to be counted.
            var fixture = Setup((db, userId, checking, _) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));

                var envelope = new Account
                {
                    UserId = userId,
                    Name = "Notebook",
                    Type = EnumAccountType.Checking,
                    IsSystem = true,
                };
                db.Accounts.Add(envelope);
                db.SaveChanges();

                var contribution = Movement(userId, checking, EnumTransactionType.Transfer, 400, 10);
                contribution.DestinationAccountId = envelope.Id;
                db.Transactions.Add(contribution);
            });

            var point = Assert.Single(await RunAsync(fixture));

            Assert.Equal(600, point.Breakdown.Single(b => b.AccountId == fixture.Checking).Balance);
            Assert.Equal(400, point.Breakdown.Single(b => b.AccountName == "Notebook").Balance);
            // Saving towards a goal moves money, it does not spend it.
            Assert.Equal(1_000, point.NetWorth);
        }

        [Fact]
        public async Task AHeldPosition_CountsTowardNetWorthAtItsMarketPrice()
        {
            var fixture = Setup((db, userId, checking, _) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));

                var asset = new MarketAsset
                {
                    Ticker = "PETR4",
                    Name = "Petrobras",
                    AssetType = EnumAssetType.Acao,
                    CurrentPrice = 40,
                };
                db.MarketAssets.Add(asset);
                db.SaveChanges();

                var investment = new Investment
                {
                    UserId = userId,
                    MarketAssetId = asset.Id,
                    AccountId = checking,
                    CurrentQuantity = 10,
                    AveragePrice = 30,
                };
                db.Investments.Add(investment);
                db.SaveChanges();

                db.InvestmentTransactions.Add(new InvestmentTransaction
                {
                    UserId = userId,
                    InvestmentId = investment.Id,
                    Operation = EnumInvestmentOperation.Buy,
                    Date = new DateOnly(Year, Month, 3),
                    Quantity = 10,
                    UnitPrice = 30,
                    TotalValue = 300,
                });

                // The close the market published inside the month: 10 x 35 = 350.
                db.MarketPriceHistories.Add(new MarketPriceHistory
                {
                    MarketAssetId = asset.Id,
                    Date = new DateOnly(Year, Month, 28),
                    Price = 35,
                });
            });

            var point = Assert.Single(await RunAsync(fixture));

            Assert.Equal(350, point.Investments);
            Assert.Equal(1_350, point.NetWorth);
        }

        [Fact]
        public async Task APositionTheMarketDoesNotQuote_IsValuedAtWhatWasPaidForIt()
        {
            var fixture = Setup((db, userId, checking, _) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));

                var asset = new MarketAsset
                {
                    Ticker = "CDB-XP",
                    Name = "CDB",
                    AssetType = EnumAssetType.RendaFixa,
                    CurrentPrice = 0,
                };
                db.MarketAssets.Add(asset);
                db.SaveChanges();

                var investment = new Investment
                {
                    UserId = userId,
                    MarketAssetId = asset.Id,
                    AccountId = checking,
                    CurrentQuantity = 2,
                    AveragePrice = 250,
                    YieldIndex = EnumYieldIndex.Cdi,
                    ExpectedYieldPct = 110,
                };
                db.Investments.Add(investment);
                db.SaveChanges();

                db.InvestmentTransactions.Add(new InvestmentTransaction
                {
                    UserId = userId,
                    InvestmentId = investment.Id,
                    Operation = EnumInvestmentOperation.Buy,
                    Date = new DateOnly(Year, Month, 4),
                    Quantity = 2,
                    UnitPrice = 250,
                    TotalValue = 500,
                });
            });

            var point = Assert.Single(await RunAsync(fixture));

            // No price history to read, so it shows the amount invested rather than a
            // yield curve nobody published.
            Assert.Equal(500, point.Investments);
            Assert.Equal(1_500, point.NetWorth);
        }

        [Fact]
        public async Task ASoldOutPosition_StopsCountingOnceItIsGone()
        {
            var fixture = Setup((db, userId, checking, _) =>
            {
                db.Transactions.Add(Movement(userId, checking, EnumTransactionType.Income, 1_000, 1));

                var asset = new MarketAsset
                {
                    Ticker = "VALE3",
                    Name = "Vale",
                    AssetType = EnumAssetType.Acao,
                    CurrentPrice = 50,
                };
                db.MarketAssets.Add(asset);
                db.SaveChanges();

                var investment = new Investment
                {
                    UserId = userId,
                    MarketAssetId = asset.Id,
                    AccountId = checking,
                    CurrentQuantity = 0,
                    AveragePrice = 50,
                };
                db.Investments.Add(investment);
                db.SaveChanges();

                db.InvestmentTransactions.AddRange(
                    new InvestmentTransaction
                    {
                        UserId = userId,
                        InvestmentId = investment.Id,
                        Operation = EnumInvestmentOperation.Buy,
                        Date = new DateOnly(Year, Month, 2),
                        Quantity = 5,
                        UnitPrice = 50,
                        TotalValue = 250,
                    },
                    new InvestmentTransaction
                    {
                        UserId = userId,
                        InvestmentId = investment.Id,
                        Operation = EnumInvestmentOperation.Sell,
                        Date = new DateOnly(Year, Month, 15),
                        Quantity = 5,
                        UnitPrice = 60,
                        TotalValue = 300,
                    });

                db.MarketPriceHistories.Add(new MarketPriceHistory
                {
                    MarketAssetId = asset.Id,
                    Date = new DateOnly(Year, Month, 28),
                    Price = 60,
                });
            });

            var point = Assert.Single(await RunAsync(fixture));

            Assert.Equal(0, point.Investments);
            Assert.Equal(1_000, point.NetWorth);
        }
    }
}
