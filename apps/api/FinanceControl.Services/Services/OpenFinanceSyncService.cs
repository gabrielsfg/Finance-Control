using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Helpers;
using FinanceControl.Services.Pluggy;
using FinanceControl.Services.Seeds;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// The bank sync itself: mirrors a Pluggy item into a <see cref="BankConnection"/> and
    /// upserts the transactions of its linked accounts.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Only the webhook worker calls the transaction side, one event at a time, so two syncs
    /// of the same bank never interleave. The unique (UserId, ExternalId) index is the
    /// backstop if they ever did: the second insert fails and the worker retries it as an
    /// update.
    /// </para>
    /// <para>
    /// Every sync is an upsert keyed on Pluggy's transaction id. Pluggy re-reads the last
    /// days on each collection and the worker re-reads a window on top, so the same rows
    /// arrive many times; only new ids become new transactions.
    /// </para>
    /// </remarks>
    public class OpenFinanceSyncService
    {
        public const string InternalImportEvent = "internal/import";
        public const string InternalSyncEvent = "internal/sync";

        /// Hand-typed rows this many days away from a bank row can still be the same payment.
        private const int MatchWindowDays = 3;

        private static readonly HashSet<string> IncomeSeedKeys =
            ["salary", "retirementIncome", "dividends", "yield", "reimbursement"];

        private static readonly HashSet<string> TransferOperationTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "PIX", "TED", "DOC", "TEF", "TRANSFERENCIA", "TRANSFERENCIA_MESMA_INSTITUICAO", "PAGAMENTO_FATURA"
        };

        private static readonly string[] TransferDescriptionMarkers =
            ["PAGAMENTO FATURA", "PGTO FATURA", "PAG FATURA", "PAGTO FATURA", "TRANSF"];

        private readonly ApplicationDbContext _context;
        private readonly PluggyClient _pluggy;
        private readonly ImportCategorizer _categorizer;
        private readonly OpenFinanceInvestmentSyncService _investments;
        private readonly OpenFinanceSettings _settings;
        private readonly ILogger<OpenFinanceSyncService> _logger;

        public OpenFinanceSyncService(
            ApplicationDbContext context,
            PluggyClient pluggy,
            ImportCategorizer categorizer,
            OpenFinanceInvestmentSyncService investments,
            IOptions<OpenFinanceSettings> settings,
            ILogger<OpenFinanceSyncService> logger)
        {
            _context = context;
            _pluggy = pluggy;
            _categorizer = categorizer;
            _investments = investments;
            _settings = settings.Value;
            _logger = logger;
        }

        /// <summary>Work we queue ourselves, processed by the same worker as Pluggy's webhooks.</summary>
        public static PluggyWebhookEvent CreateInternalEvent(string eventType, string itemId) => new()
        {
            EventId = $"{eventType}:{itemId}:{Guid.NewGuid():N}",
            EventType = eventType,
            ItemId = itemId,
            Payload = JsonSerializer.Serialize(new { @event = eventType, itemId })
        };

        /// <summary>
        /// Applies one stored event. Throws on anything worth retrying (Pluggy unreachable,
        /// database error); the worker backs off and calls again.
        /// </summary>
        public async Task ApplyEventAsync(string eventType, PluggyWebhookPayload payload, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(payload.ItemId))
                return;

            switch (eventType)
            {
                case "item/created":
                case "item/updated":
                case InternalImportEvent:
                case InternalSyncEvent:
                {
                    var connection = await RefreshConnectionAsync(payload.ItemId, cancellationToken);
                    if (connection is not null && PluggyStatusMapper.HasFreshData(connection.Status))
                    {
                        await SyncLinkedAccountsAsync(connection, cancellationToken);
                        await _investments.SyncAsync(connection, cancellationToken);
                    }
                    break;
                }

                case "item/error":
                case "item/login_succeeded":
                case "item/waiting_user_input":
                case "item/waiting_user_action":
                    await RefreshConnectionAsync(payload.ItemId, cancellationToken);
                    break;

                case "item/deleted":
                    await MarkDisconnectedAsync(payload.ItemId, cancellationToken);
                    break;

                case "transactions/created":
                    await ImportCreatedAsync(payload, cancellationToken);
                    break;

                case "transactions/updated":
                    await ImportByIdsAsync(payload, cancellationToken);
                    break;

                case "transactions/deleted":
                    await ApplyDeletedAsync(payload, cancellationToken);
                    break;

                default:
                    // connector/status_updated and anything newer: nothing to apply.
                    break;
            }
        }

        /// <summary>
        /// Reads the item from Pluggy and mirrors it, creating the connection when it is new
        /// (a widget closed before the app could register it). Null when the item is gone
        /// or belongs to no user of ours.
        /// </summary>
        public async Task<BankConnection?> RefreshConnectionAsync(string itemId, CancellationToken cancellationToken)
        {
            var result = await _pluggy.GetItemAsync(itemId, cancellationToken);
            if (!result.IsSuccess)
            {
                if (result.StatusCode == 404)
                {
                    await MarkDisconnectedAsync(itemId, cancellationToken);
                    return null;
                }
                throw new InvalidOperationException($"Pluggy item lookup failed ({result.StatusCode} {result.ErrorCode}).");
            }

            var item = result.Value!;
            var connection = await _context.BankConnections
                .Include(c => c.Accounts)
                .FirstOrDefaultAsync(c => c.ItemId == itemId, cancellationToken);

            if (connection is null)
            {
                var userId = await ResolveUserIdAsync(item.ClientUserId, cancellationToken);
                if (userId is null)
                {
                    _logger.LogWarning("Pluggy item {ItemId} has no matching user; ignored.", itemId);
                    return null;
                }
                return await UpsertConnectionAsync(item, userId.Value, cancellationToken);
            }

            if (connection.Status == EnumBankConnectionStatus.Disconnected)
                return null;

            return await UpsertConnectionAsync(item, connection.UserId, cancellationToken);
        }

        /// <summary>
        /// Creates or updates the connection for an item already known to belong to the
        /// user, and refreshes its accounts (new ones arrive as PendingLink).
        /// </summary>
        public async Task<BankConnection> UpsertConnectionAsync(PluggyItem item, int userId, CancellationToken cancellationToken)
        {
            var connection = await _context.BankConnections
                .Include(c => c.Accounts)
                .FirstOrDefaultAsync(c => c.ItemId == item.Id, cancellationToken);

            if (connection is null)
            {
                connection = new BankConnection { UserId = userId, ItemId = item.Id };
                _context.BankConnections.Add(connection);
            }

            var now = DateTime.UtcNow;
            if (item.Connector is { } connector)
            {
                connection.ConnectorId = connector.Id;
                connection.ConnectorName = Truncate(connector.Name, 150);
                connection.ConnectorImageUrl = TruncateOrNull(connector.ImageUrl, 500);
                connection.ConnectorPrimaryColor = TruncateOrNull(connector.PrimaryColor, 20);
            }

            connection.Status = PluggyStatusMapper.Map(item, now);
            connection.ExecutionStatus = TruncateOrNull(item.ExecutionStatus, 60);
            connection.LastErrorCode = TruncateOrNull(item.Error?.Code, 60);
            connection.LastErrorMessage = TruncateOrNull(item.Error?.Message, 500);
            connection.LastSyncedAt = item.LastUpdatedAt ?? connection.LastSyncedAt;
            connection.NextAutoSyncAt = item.NextAutoSyncAt;
            connection.ConsentExpiresAt = item.ConsentExpiresAt;

            // Accounts are only reliable after a successful collection; a brand-new item
            // still collecting may answer with none.
            if (PluggyStatusMapper.HasFreshData(connection.Status) || connection.Accounts.Count == 0)
                await RefreshAccountsAsync(connection, cancellationToken);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when (IsUniqueViolation(exception))
            {
                // The app and the webhook registered the same item at once; the other one
                // won. Start over from what it stored.
                _context.ChangeTracker.Clear();
                return await _context.BankConnections
                    .Include(c => c.Accounts)
                    .FirstAsync(c => c.ItemId == item.Id, cancellationToken);
            }

            return connection;
        }

        private async Task RefreshAccountsAsync(BankConnection connection, CancellationToken cancellationToken)
        {
            var result = await _pluggy.GetAccountsAsync(connection.ItemId, cancellationToken);
            if (!result.IsSuccess)
            {
                _logger.LogWarning("Could not read the accounts of item {ItemId} ({StatusCode}).", connection.ItemId, result.StatusCode);
                return;
            }

            var now = DateTime.UtcNow;
            foreach (var account in result.Value!.Results)
            {
                var row = connection.Accounts.FirstOrDefault(a => a.ExternalAccountId == account.Id);
                if (row is null)
                {
                    row = new BankConnectionAccount
                    {
                        UserId = connection.UserId,
                        ExternalAccountId = account.Id,
                        Status = EnumBankAccountLinkStatus.PendingLink
                    };
                    connection.Accounts.Add(row);
                }

                row.ExternalType = Truncate(account.Type, 30);
                row.ExternalSubtype = TruncateOrNull(account.Subtype, 40);
                row.Name = Truncate(account.MarketingName ?? account.Name ?? connection.ConnectorName, 200);
                row.Number = TruncateOrNull(account.Number, 60);
                row.ExternalBalance = ToCents(account.Balance);
                row.ExternalBalanceAt = now;
                row.ExternalCreditLimit = account.CreditData?.CreditLimit is { } limit ? ToCents(limit) : null;
            }
        }

        /// <summary>
        /// Reads every linked account: from its start date on the first run, then a
        /// window of recent days. Cheap to repeat — the upsert drops what is known.
        /// </summary>
        public async Task SyncLinkedAccountsAsync(BankConnection connection, CancellationToken cancellationToken)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var linked = connection.Accounts
                .Where(a => a.Status == EnumBankAccountLinkStatus.Linked && a.AccountId != null)
                .ToList();

            foreach (var link in linked)
            {
                var isInitial = link.InitialImportCompletedAt is null;
                var windowStart = today.AddDays(-Math.Max(1, _settings.SyncWindowDays));
                var from = isInitial
                    ? link.ImportFromDate ?? windowStart
                    : Max(link.ImportFromDate ?? DateOnly.MinValue, windowStart);

                var result = await _pluggy.ListTransactionsAsync(link.ExternalAccountId, dateFrom: from, cancellationToken: cancellationToken);
                if (!result.IsSuccess)
                    throw new InvalidOperationException($"Pluggy transaction listing failed ({result.StatusCode} {result.ErrorCode}).");

                await UpsertTransactionsAsync(connection.UserId, link, result.Value!, cancellationToken);

                if (isInitial)
                {
                    link.InitialImportCompletedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }

        private async Task ImportCreatedAsync(PluggyWebhookPayload payload, CancellationToken cancellationToken)
        {
            var link = await FindLinkedAccountAsync(payload.AccountId, cancellationToken);
            if (link is null)
                return;

            // Before the first full import there is nothing to add to; that import reads it all.
            if (link.InitialImportCompletedAt is null)
                return;

            var result = payload.TransactionsCreatedAtFrom is { } createdAtFrom
                ? await _pluggy.ListTransactionsAsync(link.ExternalAccountId, createdAtFrom: createdAtFrom, cancellationToken: cancellationToken)
                : await _pluggy.ListTransactionsAsync(
                    link.ExternalAccountId,
                    dateFrom: DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-_settings.SyncWindowDays),
                    cancellationToken: cancellationToken);

            if (!result.IsSuccess)
                throw new InvalidOperationException($"Pluggy transaction listing failed ({result.StatusCode} {result.ErrorCode}).");

            await UpsertTransactionsAsync(link.UserId, link, result.Value!, cancellationToken);
        }

        private async Task ImportByIdsAsync(PluggyWebhookPayload payload, CancellationToken cancellationToken)
        {
            if (payload.TransactionIds is not { Count: > 0 } ids)
                return;

            var link = await FindLinkedAccountAsync(payload.AccountId, cancellationToken);
            if (link is null || link.InitialImportCompletedAt is null)
                return;

            foreach (var chunk in ids.Distinct().Chunk(500))
            {
                var result = await _pluggy.ListTransactionsAsync(link.ExternalAccountId, ids: chunk, cancellationToken: cancellationToken);
                if (!result.IsSuccess)
                    throw new InvalidOperationException($"Pluggy transaction lookup failed ({result.StatusCode} {result.ErrorCode}).");

                await UpsertTransactionsAsync(link.UserId, link, result.Value!, cancellationToken);
            }
        }

        private async Task<BankConnectionAccount?> FindLinkedAccountAsync(string? externalAccountId, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(externalAccountId))
                return null;

            return await _context.BankConnectionAccounts
                .Include(a => a.BankConnection)
                .FirstOrDefaultAsync(a => a.ExternalAccountId == externalAccountId
                    && a.Status == EnumBankAccountLinkStatus.Linked
                    && a.AccountId != null
                    && a.BankConnection.Status != EnumBankConnectionStatus.Disconnected,
                    cancellationToken);
        }

        /// <summary>
        /// Pluggy removed these transactions (usually a pending one replaced by its posted
        /// version under a new id). Rows the user has not touched go; rows they edited
        /// stay and only lose the link to the bank.
        /// </summary>
        private async Task ApplyDeletedAsync(PluggyWebhookPayload payload, CancellationToken cancellationToken)
        {
            if (payload.TransactionIds is not { Count: > 0 } ids)
                return;

            var userId = await _context.BankConnections
                .Where(c => c.ItemId == payload.ItemId)
                .Select(c => (int?)c.UserId)
                .FirstOrDefaultAsync(cancellationToken);
            if (userId is null)
                return;

            var rows = await _context.Transactions
                .Where(t => t.UserId == userId
                    && ((t.ExternalId != null && ids.Contains(t.ExternalId))
                        || (t.ExternalCounterpartId != null && ids.Contains(t.ExternalCounterpartId))))
                .ToListAsync(cancellationToken);

            foreach (var row in rows)
            {
                if (row.ExternalCounterpartId is not null && ids.Contains(row.ExternalCounterpartId))
                    row.ExternalCounterpartId = null;

                if (row.ExternalId is null || !ids.Contains(row.ExternalId))
                    continue;

                if (!row.ExternalModified && row.Type != EnumTransactionType.Transfer && row.Source == EnumTransactionSource.OpenFinance)
                    _context.Transactions.Remove(row);
                else
                    row.ExternalId = null;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task MarkDisconnectedAsync(string itemId, CancellationToken cancellationToken)
        {
            var connection = await _context.BankConnections.FirstOrDefaultAsync(c => c.ItemId == itemId, cancellationToken);
            if (connection is null || connection.Status == EnumBankConnectionStatus.Disconnected)
                return;

            connection.Status = EnumBankConnectionStatus.Disconnected;
            connection.DisconnectedAt = DateTime.UtcNow;
            connection.NextAutoSyncAt = null;
            await _context.SaveChangesAsync(cancellationToken);
        }

        /// <summary>
        /// The upsert. Known ids are updated (unless the user edited them), ids the user
        /// deleted are skipped, and new ones are first matched against hand-typed rows
        /// before becoming new transactions.
        /// </summary>
        public async Task UpsertTransactionsAsync(
            int userId,
            BankConnectionAccount link,
            IReadOnlyList<PluggyTransaction> incoming,
            CancellationToken cancellationToken)
        {
            if (link.AccountId is not { } accountId)
                return;

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId, cancellationToken);
            if (account is null)
                return;

            var isCard = link.ExternalType.Equals("CREDIT", StringComparison.OrdinalIgnoreCase);
            var startDate = link.ImportFromDate ?? DateOnly.MinValue;

            var rows = incoming
                .Where(t => !IsPending(t))
                .Select(t => (Source: t, Mapped: Map(t, isCard)))
                .Where(r => r.Mapped is not null && r.Mapped.Date >= startDate)
                .GroupBy(r => r.Source.Id)
                .Select(g => (g.First().Source, Mapped: g.First().Mapped!))
                .ToList();

            if (rows.Count == 0)
                return;

            var ids = rows.Select(r => r.Source.Id).ToList();

            var existing = await _context.Transactions
                .Where(t => t.UserId == userId
                    && ((t.ExternalId != null && ids.Contains(t.ExternalId))
                        || (t.ExternalCounterpartId != null && ids.Contains(t.ExternalCounterpartId))))
                .ToListAsync(cancellationToken);

            var byExternalId = existing
                .Where(t => t.ExternalId is not null)
                .GroupBy(t => t.ExternalId!)
                .ToDictionary(g => g.Key, g => g.First());
            var folded = existing
                .Where(t => t.ExternalCounterpartId is not null)
                .Select(t => t.ExternalCounterpartId!)
                .ToHashSet();

            var ignored = (await _context.IgnoredExternalTransactions
                .Where(i => i.UserId == userId && ids.Contains(i.ExternalId))
                .Select(i => i.ExternalId)
                .ToListAsync(cancellationToken)).ToHashSet();

            var pending = new List<(PluggyTransaction Source, MappedTransaction Mapped)>();
            foreach (var (source, mapped) in rows)
            {
                if (ignored.Contains(source.Id) || folded.Contains(source.Id))
                    continue;

                if (byExternalId.TryGetValue(source.Id, out var current))
                {
                    // The bank corrected the row; follow it unless the user took it over.
                    if (!current.ExternalModified)
                    {
                        current.Value = mapped.Value;
                        current.TransactionDate = mapped.Date;
                        current.Description = mapped.Description;
                        if (current.Type != EnumTransactionType.Transfer)
                            current.Type = mapped.Type;
                    }
                    continue;
                }

                pending.Add((source, mapped));
            }

            if (pending.Count == 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
                return;
            }

            var created = await MatchOrBuildAsync(userId, account, pending, cancellationToken);

            if (created.Count > 0)
            {
                await CategorizeAsync(userId, created, cancellationToken);
                _context.Transactions.AddRange(created.Select(c => c.Row));
            }

            await _context.SaveChangesAsync(cancellationToken);

            if (created.Count > 0)
            {
                await LinkInstallmentsAsync(userId, account.Id, created.Select(c => c.Row).ToList(), cancellationToken);
                await FoldTransfersAsync(userId, created, cancellationToken);
            }
        }

        /// <summary>
        /// Matches each new bank row against hand-typed rows of the same account (same
        /// value and direction, date within a few days). One candidate: that row takes
        /// the bank id and nothing is created. Several: a new row is created and flagged
        /// as a possible duplicate, since guessing would merge the wrong pair.
        /// </summary>
        private async Task<List<(PluggyTransaction Source, Transaction Row)>> MatchOrBuildAsync(
            int userId,
            Account account,
            List<(PluggyTransaction Source, MappedTransaction Mapped)> pending,
            CancellationToken cancellationToken)
        {
            var minDate = pending.Min(p => p.Mapped.Date).AddDays(-MatchWindowDays);
            var maxDate = pending.Max(p => p.Mapped.Date).AddDays(MatchWindowDays);

            var candidates = await _context.Transactions
                .Where(t => t.UserId == userId
                    && t.ExternalId == null
                    && t.TransactionDate >= minDate
                    && t.TransactionDate <= maxDate
                    && (t.AccountId == account.Id || t.DestinationAccountId == account.Id))
                .ToListAsync(cancellationToken);

            var claimed = new HashSet<int>();
            var created = new List<(PluggyTransaction Source, Transaction Row)>();
            var isCard = account.Type == EnumAccountType.Credit;

            foreach (var (source, mapped) in pending.OrderBy(p => p.Mapped.Date))
            {
                var isInflow = mapped.Type == EnumTransactionType.Income;
                var matches = candidates
                    .Where(c => !claimed.Contains(c.Id)
                        && c.Value == mapped.Value
                        && Math.Abs(c.TransactionDate.DayNumber - mapped.Date.DayNumber) <= MatchWindowDays
                        && IsInflow(c, account.Id) == isInflow)
                    .ToList();

                if (matches.Count == 1)
                {
                    var match = matches[0];
                    claimed.Add(match.Id);
                    match.ExternalId = source.Id;
                    match.ExternalProviderId = TruncateOrNull(source.ProviderId, 200);
                    continue;
                }

                var installments = source.CreditCardMetadata is { TotalInstallments: > 1 } metadata
                    ? (Number: metadata.InstallmentNumber, Total: metadata.TotalInstallments)
                    : (Number: (int?)null, Total: (int?)null);

                created.Add((source, new Transaction
                {
                    UserId = userId,
                    AccountId = account.Id,
                    Value = mapped.Value,
                    Type = mapped.Type,
                    Description = mapped.Description,
                    TransactionDate = mapped.Date,
                    PaymentType = installments.Total is > 1 ? EnumPaymentType.Installment : EnumPaymentType.OneTime,
                    PaymentMethod = isCard ? EnumPaymentMethod.Credit : EnumPaymentMethod.Debit,
                    InstallmentNumber = installments.Number,
                    TotalInstallments = installments.Total,
                    Source = EnumTransactionSource.OpenFinance,
                    ExternalId = source.Id,
                    ExternalProviderId = TruncateOrNull(source.ProviderId, 200),
                    NeedsReview = true,
                    PossibleDuplicate = matches.Count > 1
                }));
            }

            return created;
        }

        /// <summary>
        /// The user's own history first (and Claude, when the plan and settings allow it),
        /// then Pluggy's category mapped to a default subcategory, then a catch-all.
        /// </summary>
        private async Task CategorizeAsync(
            int userId,
            List<(PluggyTransaction Source, Transaction Row)> created,
            CancellationToken cancellationToken)
        {
            var suggestions = await _categorizer.SuggestAsync(
                created.Select(c => new ImportCategorizationInput(c.Row.Description, c.Row.Value, c.Row.Type)).ToList(),
                userId,
                cancellationToken);

            var subCategories = await _context.SubCategories
                .AsNoTracking()
                .Where(s => s.UserId == userId && !s.IsSystem)
                .Select(s => new { s.Id, s.Name })
                .ToListAsync(cancellationToken);

            int? FindSeed(string key)
            {
                var labels = UserSeedData.GetLabels(key);
                return subCategories
                    .Where(s => labels.Contains(s.Name, StringComparer.OrdinalIgnoreCase))
                    .Select(s => (int?)s.Id)
                    .FirstOrDefault();
            }

            var budgetId = await _context.Budgets
                .Where(b => b.UserId == userId && b.IsActive)
                .Select(b => (int?)b.Id)
                .FirstOrDefaultAsync(cancellationToken);

            int? expenseFallback = null;
            int? incomeFallback = null;

            for (var i = 0; i < created.Count; i++)
            {
                var (source, row) = created[i];
                var isIncome = row.Type == EnumTransactionType.Income;

                var subCategoryId = suggestions[i].SubCategoryId;
                if (subCategoryId is null && PluggyCategoryMap.Resolve(source.Category) is { } seedKey
                    && IncomeSeedKeys.Contains(seedKey) == isIncome)
                    subCategoryId = FindSeed(seedKey);

                if (subCategoryId is null)
                {
                    if (isIncome)
                        subCategoryId = incomeFallback ??= FindSeed("otherIncome") ?? await CreateFallbackAsync(userId, isIncome: true);
                    else
                        subCategoryId = expenseFallback ??= FindSeed("otherExpenses") ?? await CreateFallbackAsync(userId, isIncome: false);
                }

                row.SubCategoryId = subCategoryId.Value;
                row.BudgetId = budgetId;
            }
        }

        // The user deleted the default "other" subcategories; a bank row still needs one.
        private async Task<int> CreateFallbackAsync(int userId, bool isIncome)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.UserId == userId && !c.IsSystem && c.Name == "Outros");
            if (category is null)
            {
                category = new Category { UserId = userId, Name = "Outros", Color = "#8a95a3" };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
            }

            var subCategory = new SubCategory
            {
                UserId = userId,
                CategoryId = category.Id,
                Name = isIncome ? "Outras receitas" : "Outros gastos",
                Emoji = isIncome ? "💵" : "💸"
            };
            _context.SubCategories.Add(subCategory);
            await _context.SaveChangesAsync();
            return subCategory.Id;
        }

        /// <summary>
        /// Card installments arrive one per month, so the series is not expanded like a file
        /// import does; each later installment is only linked to the first one when found.
        /// </summary>
        private async Task LinkInstallmentsAsync(int userId, int accountId, List<Transaction> rows, CancellationToken cancellationToken)
        {
            var later = rows.Where(r => r.InstallmentNumber > 1 && r.TotalInstallments > 1).ToList();
            if (later.Count == 0)
                return;

            var totals = later.Select(r => r.TotalInstallments!.Value).Distinct().ToList();
            var firsts = await _context.Transactions
                .Where(t => t.UserId == userId
                    && t.AccountId == accountId
                    && t.InstallmentNumber == 1
                    && t.ParentTransactionId == null
                    && t.TotalInstallments != null
                    && totals.Contains(t.TotalInstallments.Value))
                .ToListAsync(cancellationToken);
            if (firsts.Count == 0)
                return;

            foreach (var row in later)
            {
                var key = InstallmentKey(row.Description);
                var parent = firsts
                    .Where(f => f.TotalInstallments == row.TotalInstallments
                        && f.Value == row.Value
                        && f.TransactionDate < row.TransactionDate
                        && InstallmentKey(f.Description) == key)
                    .OrderByDescending(f => f.TransactionDate)
                    .FirstOrDefault();
                if (parent is not null)
                    row.ParentTransactionId = parent.Id;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        /// <summary>
        /// Money moved between two of the user's connected accounts shows up twice: a debit
        /// in one, a credit in the other (a card bill paid from checking, a Pix to savings).
        /// When a new row looks like a transfer and exactly one opposite row from another
        /// connected account matches it, both become a single Transfer.
        /// </summary>
        private async Task FoldTransfersAsync(
            int userId,
            List<(PluggyTransaction Source, Transaction Row)> created,
            CancellationToken cancellationToken)
        {
            var candidates = created
                .Where(c => c.Row.Type != EnumTransactionType.Transfer && LooksLikeTransfer(c.Source))
                .ToList();
            if (candidates.Count == 0)
                return;

            var linkedAccountIds = await _context.BankConnectionAccounts
                .Where(a => a.UserId == userId && a.Status == EnumBankAccountLinkStatus.Linked && a.AccountId != null)
                .Select(a => a.AccountId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);
            if (linkedAccountIds.Count < 2)
                return;

            int? transferSubCategoryId = null;
            var removedIds = new List<int>();

            foreach (var (_, row) in candidates)
            {
                // A row folded earlier in this loop is gone or already a transfer.
                if (removedIds.Contains(row.Id) || row.Type == EnumTransactionType.Transfer)
                    continue;

                var oppositeType = row.Type == EnumTransactionType.Expense ? EnumTransactionType.Income : EnumTransactionType.Expense;
                var from = row.TransactionDate.AddDays(-MatchWindowDays);
                var to = row.TransactionDate.AddDays(MatchWindowDays);

                var opposites = await _context.Transactions
                    .Where(t => t.UserId == userId
                        && t.Id != row.Id
                        && !removedIds.Contains(t.Id)
                        && t.Source == EnumTransactionSource.OpenFinance
                        && t.ExternalId != null
                        && !t.ExternalModified
                        && t.Type == oppositeType
                        && t.Value == row.Value
                        && t.AccountId != row.AccountId
                        && linkedAccountIds.Contains(t.AccountId)
                        && t.TransactionDate >= from
                        && t.TransactionDate <= to)
                    .ToListAsync(cancellationToken);

                if (opposites.Count != 1)
                    continue;

                var other = opposites[0];
                var outflow = row.Type == EnumTransactionType.Expense ? row : other;
                var inflow = row.Type == EnumTransactionType.Expense ? other : row;

                transferSubCategoryId ??= await TransferSubCategoryHelper.GetIdAsync(_context, userId);

                outflow.Type = EnumTransactionType.Transfer;
                outflow.DestinationAccountId = inflow.AccountId;
                outflow.ExternalCounterpartId = inflow.ExternalId;
                outflow.SubCategoryId = transferSubCategoryId.Value;
                outflow.BudgetId = null;
                outflow.PaymentType = EnumPaymentType.OneTime;
                outflow.PaymentMethod = null;
                outflow.InstallmentNumber = null;
                outflow.TotalInstallments = null;
                outflow.PossibleDuplicate = false;
                outflow.NeedsReview = true;

                _context.Transactions.Remove(inflow);
                removedIds.Add(inflow.Id);
            }

            if (removedIds.Count > 0)
                await _context.SaveChangesAsync(cancellationToken);
        }

        private static bool LooksLikeTransfer(PluggyTransaction transaction)
        {
            if (transaction.OperationType is { } operation && TransferOperationTypes.Contains(operation))
                return true;

            var category = transaction.Category?.ToLowerInvariant() ?? string.Empty;
            if (category.Contains("transfer") || category.Contains("credit card payment"))
                return true;

            var description = (transaction.Description ?? string.Empty).ToUpperInvariant();
            return TransferDescriptionMarkers.Any(description.Contains);
        }

        private static bool IsInflow(Transaction transaction, int accountId) => transaction.Type switch
        {
            EnumTransactionType.Income => true,
            EnumTransactionType.Transfer => transaction.DestinationAccountId == accountId,
            _ => false
        };

        private static bool IsPending(PluggyTransaction transaction) =>
            string.Equals(transaction.Status, "PENDING", StringComparison.OrdinalIgnoreCase);

        /// <summary>
        /// A Pluggy row in our terms, or null when it carries no money. Cards: a positive
        /// amount is a purchase. Accounts: the direction is in Type (DEBIT = outflow), with
        /// the sign as fallback.
        /// </summary>
        private static MappedTransaction? Map(PluggyTransaction transaction, bool isCard)
        {
            var amount = transaction.AmountInAccountCurrency ?? transaction.Amount;
            var value = ToCents(Math.Abs(amount));
            if (value == 0)
                return null;

            bool isOutflow;
            if (isCard)
                isOutflow = amount > 0;
            else if (string.Equals(transaction.Type, "DEBIT", StringComparison.OrdinalIgnoreCase))
                isOutflow = true;
            else if (string.Equals(transaction.Type, "CREDIT", StringComparison.OrdinalIgnoreCase))
                isOutflow = false;
            else
                isOutflow = amount < 0;

            // Pluggy dates are midnight UTC; converting to Brasília time would move them to
            // the previous day.
            var date = DateOnly.FromDateTime(transaction.Date.ToUniversalTime());
            var description = (transaction.Description ?? transaction.DescriptionRaw ?? string.Empty).Trim();
            if (description.Length == 0)
                description = "Transação bancária";

            return new MappedTransaction(
                isOutflow ? EnumTransactionType.Expense : EnumTransactionType.Income,
                value,
                date,
                Truncate(description, 500));
        }

        private static string InstallmentKey(string description) =>
            ImportDescriptionHelper.ToPrefixKey(ImportDescriptionHelper.ToMatchKey(description), words: 3);

        private async Task<int?> ResolveUserIdAsync(string? clientUserId, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(clientUserId, out var externalRef))
                return null;

            return await _context.Users
                .Where(u => u.ExternalRef == externalRef)
                .Select(u => (int?)u.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public static int ToCents(decimal amount) => (int)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);

        private static DateOnly Max(DateOnly a, DateOnly b) => a > b ? a : b;

        private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

        private static string? TruncateOrNull(string? value, int max) =>
            string.IsNullOrEmpty(value) ? null : Truncate(value, max);

        private static bool IsUniqueViolation(DbUpdateException exception) =>
            exception.InnerException is Npgsql.PostgresException { SqlState: Npgsql.PostgresErrorCodes.UniqueViolation };

        private record MappedTransaction(EnumTransactionType Type, int Value, DateOnly Date, string Description);
    }
}
