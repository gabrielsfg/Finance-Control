using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Helpers;
using FinanceControl.Services.Pluggy;
using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FinanceControl.Shared.Dtos.Response.OpenFinance;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// What the user does with bank connections: connect, link accounts, sync, disconnect.
    /// </summary>
    /// <remarks>
    /// Nothing here imports transactions. Linking queues an internal event and the webhook
    /// worker does the import, so every write to synced transactions happens in one place,
    /// one event at a time (see <see cref="OpenFinanceSyncService"/>).
    /// </remarks>
    public class OpenFinanceService : IOpenFinanceService
    {
        private static readonly TimeSpan ConnectorCacheDuration = TimeSpan.FromHours(24);

        private readonly ApplicationDbContext _context;
        private readonly PluggyClient _pluggy;
        private readonly OpenFinanceSyncService _sync;
        private readonly IMemoryCache _cache;
        private readonly OpenFinanceSettings _settings;
        private readonly PluggySettings _pluggySettings;
        private readonly BillingSettings _billingSettings;
        private readonly ILogger<OpenFinanceService> _logger;

        public OpenFinanceService(
            ApplicationDbContext context,
            PluggyClient pluggy,
            OpenFinanceSyncService sync,
            IMemoryCache cache,
            IOptions<OpenFinanceSettings> settings,
            IOptions<PluggySettings> pluggySettings,
            IOptions<BillingSettings> billingSettings,
            ILogger<OpenFinanceService> logger)
        {
            _context = context;
            _pluggy = pluggy;
            _sync = sync;
            _cache = cache;
            _settings = settings.Value;
            _pluggySettings = pluggySettings.Value;
            _billingSettings = billingSettings.Value;
            _logger = logger;
        }

        private bool IsAvailable => _settings.Enabled && _pluggy.IsConfigured;

        public async Task<OpenFinanceStatusResponseDto> GetStatusAsync(int userId, CancellationToken cancellationToken = default)
        {
            var connections = await _context.BankConnections
                .AsNoTracking()
                .Where(c => c.UserId == userId && c.Status != EnumBankConnectionStatus.Disconnected)
                .Select(c => new
                {
                    c.Status,
                    HasPendingLink = c.Accounts.Any(a => a.Status == EnumBankAccountLinkStatus.PendingLink)
                })
                .ToListAsync(cancellationToken);

            var pendingReview = await _context.Transactions
                .CountAsync(t => t.UserId == userId && t.NeedsReview, cancellationToken);

            var entitlement = await GetEntitlementAsync(userId, cancellationToken);

            return new OpenFinanceStatusResponseDto
            {
                Available = IsAvailable,
                HasAccess = entitlement.HasAccess,
                Plan = entitlement.Plan,
                MaxConnections = entitlement.MaxConnections,
                ActiveConnections = connections.Count,
                PendingReviewCount = pendingReview,
                ConnectionsNeedingAttention = connections.Count(c =>
                    c.Status == EnumBankConnectionStatus.NeedsReconnect || c.HasPendingLink)
            };
        }

        public async Task<Result<List<OpenFinanceConnectorResponseDto>>> GetConnectorsAsync(int userId, CancellationToken cancellationToken = default)
        {
            if (!IsAvailable)
                return Result<List<OpenFinanceConnectorResponseDto>>.Failure(OpenFinanceErrors.Unavailable);

            var includeSandbox = _pluggySettings.IncludeSandbox;
            var cacheKey = $"pluggy:connectors:{includeSandbox}";
            if (_cache.TryGetValue(cacheKey, out List<OpenFinanceConnectorResponseDto>? cached) && cached is not null)
                return Result<List<OpenFinanceConnectorResponseDto>>.Success(cached);

            var result = await _pluggy.GetConnectorsAsync(includeSandbox, cancellationToken);
            if (!result.IsSuccess)
                return Result<List<OpenFinanceConnectorResponseDto>>.Failure(ProviderError(result.IsInconclusive));

            // Open Finance only: Pluggy is retiring the direct (scraping) connectors for
            // individuals, so offering them would mean connections that stop working.
            var connectors = result.Value!.Results
                .Where(c => c.IsOpenFinance || (includeSandbox && c.IsSandbox))
                .OrderBy(c => c.Name)
                .Select(c => new OpenFinanceConnectorResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ImageUrl = c.ImageUrl,
                    PrimaryColor = c.PrimaryColor,
                    IsOpenFinance = c.IsOpenFinance,
                    IsSandbox = c.IsSandbox,
                    HealthStatus = c.Health?.Status
                })
                .ToList();

            _cache.Set(cacheKey, connectors, ConnectorCacheDuration);
            return Result<List<OpenFinanceConnectorResponseDto>>.Success(connectors);
        }

        public async Task<Result<ConnectTokenResponseDto>> CreateConnectTokenAsync(
            int userId, CreateConnectTokenRequestDto requestDto, CancellationToken cancellationToken = default)
        {
            if (await CheckAccessAsync(userId, cancellationToken) is { } accessError)
                return Result<ConnectTokenResponseDto>.Failure(accessError);

            string? updateItemId = null;
            if (requestDto.ConnectionId is { } connectionId)
            {
                updateItemId = await _context.BankConnections
                    .Where(c => c.Id == connectionId && c.UserId == userId && c.Status != EnumBankConnectionStatus.Disconnected)
                    .Select(c => c.ItemId)
                    .FirstOrDefaultAsync(cancellationToken);
                if (updateItemId is null)
                    return Result<ConnectTokenResponseDto>.Failure(OpenFinanceErrors.ConnectionNotFound);
            }
            else
            {
                var active = await _context.BankConnections
                    .CountAsync(c => c.UserId == userId && c.Status != EnumBankConnectionStatus.Disconnected, cancellationToken);
                var entitlement = await GetEntitlementAsync(userId, cancellationToken);
                if (!entitlement.AllowsMore(active))
                    return Result<ConnectTokenResponseDto>.Failure(OpenFinanceErrors.ConnectionLimitReached);
            }

            var externalRef = await EnsureExternalRefAsync(userId, cancellationToken);

            var redirectUri = string.Equals(requestDto.Platform, "mobile", StringComparison.OrdinalIgnoreCase)
                ? _pluggySettings.MobileOAuthRedirectUri
                : _pluggySettings.WebOAuthRedirectUri;

            var result = await _pluggy.CreateConnectTokenAsync(new PluggyConnectTokenRequest
            {
                ItemId = updateItemId,
                Options = new PluggyConnectTokenOptions
                {
                    ClientUserId = externalRef.ToString(),
                    OauthRedirectUri = string.IsNullOrWhiteSpace(redirectUri) ? null : redirectUri,
                    // Same CPF and bank again → Pluggy hands back the existing item instead
                    // of a second one that would double the cost and the Open Finance caps.
                    AvoidDuplicates = updateItemId is null ? true : null
                }
            }, cancellationToken);

            if (!result.IsSuccess)
                return Result<ConnectTokenResponseDto>.Failure(ProviderError(result.IsInconclusive));

            return Result<ConnectTokenResponseDto>.Success(new ConnectTokenResponseDto
            {
                AccessToken = result.Value!.AccessToken,
                IncludeSandbox = _pluggySettings.IncludeSandbox,
                UpdateItemId = updateItemId
            });
        }

        public async Task<Result<BankConnectionResponseDto>> RegisterConnectionAsync(
            int userId, RegisterBankConnectionRequestDto requestDto, CancellationToken cancellationToken = default)
        {
            if (await CheckAccessAsync(userId, cancellationToken) is { } accessError)
                return Result<BankConnectionResponseDto>.Failure(accessError);

            var itemId = requestDto.ItemId.Trim();

            var owner = await _context.BankConnections
                .Where(c => c.ItemId == itemId)
                .Select(c => (int?)c.UserId)
                .FirstOrDefaultAsync(cancellationToken);
            if (owner is not null && owner != userId)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.ConnectionNotFound);

            var result = await _pluggy.GetItemAsync(itemId, cancellationToken);
            if (!result.IsSuccess)
            {
                return Result<BankConnectionResponseDto>.Failure(result.StatusCode is 404 or 400
                    ? OpenFinanceErrors.ConnectionNotFound
                    : ProviderError(result.IsInconclusive));
            }

            // The item id comes from the browser: only accept one created with this user's
            // connect token, or anyone could attach someone else's bank by guessing ids.
            var externalRef = await EnsureExternalRefAsync(userId, cancellationToken);
            if (!string.Equals(result.Value!.ClientUserId, externalRef.ToString(), StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("User {UserId} tried to register item {ItemId} created for another user.", userId, itemId);
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.ConnectionNotFound);
            }

            var connection = await _sync.UpsertConnectionAsync(result.Value, userId, cancellationToken);
            return Result<BankConnectionResponseDto>.Success(await BuildResponseAsync(connection.Id, userId, cancellationToken));
        }

        public async Task<List<BankConnectionResponseDto>> GetConnectionsAsync(int userId, CancellationToken cancellationToken = default)
        {
            var ids = await _context.BankConnections
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);

            var connections = new List<BankConnectionResponseDto>(ids.Count);
            foreach (var id in ids)
                connections.Add(await BuildResponseAsync(id, userId, cancellationToken));
            return connections;
        }

        public async Task<Result<BankConnectionResponseDto>> GetConnectionAsync(int userId, int connectionId, CancellationToken cancellationToken = default)
        {
            var exists = await _context.BankConnections.AnyAsync(c => c.Id == connectionId && c.UserId == userId, cancellationToken);
            if (!exists)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.ConnectionNotFound);

            return Result<BankConnectionResponseDto>.Success(await BuildResponseAsync(connectionId, userId, cancellationToken));
        }

        public async Task<Result<BankConnectionResponseDto>> LinkAccountsAsync(
            int userId, int connectionId, LinkBankAccountsRequestDto requestDto, CancellationToken cancellationToken = default)
        {
            if (await CheckAccessAsync(userId, cancellationToken) is { } accessError)
                return Result<BankConnectionResponseDto>.Failure(accessError);

            var connection = await _context.BankConnections
                .Include(c => c.Accounts)
                .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId
                    && c.Status != EnumBankConnectionStatus.Disconnected, cancellationToken);
            if (connection is null)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.ConnectionNotFound);

            var targetIds = requestDto.Accounts
                .Where(a => a.Action == EnumBankAccountLinkAction.Link && a.AccountId is not null)
                .Select(a => a.AccountId!.Value)
                .ToList();

            if (targetIds.Count != targetIds.Distinct().Count())
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.AccountAlreadyLinked);

            var targets = await _context.Accounts
                .Where(a => a.UserId == userId && !a.IsSystem && targetIds.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id, cancellationToken);

            // An app account receives one bank account's transactions, whichever connection.
            var alreadyTargeted = await _context.BankConnectionAccounts
                .Where(a => a.UserId == userId
                    && a.Status == EnumBankAccountLinkStatus.Linked
                    && a.AccountId != null
                    && targetIds.Contains(a.AccountId.Value))
                .Select(a => new { a.Id, AccountId = a.AccountId!.Value })
                .ToListAsync(cancellationToken);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var defaultStart = new DateOnly(today.Year, today.Month, 1);
            var anyLinked = false;

            foreach (var item in requestDto.Accounts)
            {
                var bankAccount = connection.Accounts.FirstOrDefault(a => a.Id == item.BankAccountId);
                if (bankAccount is null)
                    return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.BankAccountNotFound);

                var isCard = IsCard(bankAccount);

                switch (item.Action)
                {
                    case EnumBankAccountLinkAction.Ignore:
                        // Stops further imports; what was imported stays.
                        bankAccount.Status = EnumBankAccountLinkStatus.Ignored;
                        bankAccount.AccountId = null;
                        break;

                    case EnumBankAccountLinkAction.Create:
                    {
                        if (bankAccount.Status == EnumBankAccountLinkStatus.Linked)
                            return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.AlreadyLinked);

                        var name = string.IsNullOrWhiteSpace(item.Name) ? bankAccount.Name : item.Name.Trim();
                        var account = new Account
                        {
                            UserId = userId,
                            Name = name.Length > 100 ? name[..100] : name,
                            Type = SuggestAccountType(bankAccount),
                            CreditLimit = isCard ? bankAccount.ExternalCreditLimit : null
                        };
                        _context.Accounts.Add(account);
                        bankAccount.Account = account;
                        Link(bankAccount, item.ImportFromDate ?? defaultStart);
                        anyLinked = true;
                        break;
                    }

                    case EnumBankAccountLinkAction.Link:
                    {
                        if (bankAccount.Status == EnumBankAccountLinkStatus.Linked)
                        {
                            if (bankAccount.AccountId == item.AccountId)
                                continue;
                            return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.AlreadyLinked);
                        }

                        if (item.AccountId is not { } accountId || !targets.TryGetValue(accountId, out var account))
                            return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.AccountNotFound);

                        if (alreadyTargeted.Any(a => a.AccountId == accountId && a.Id != bankAccount.Id))
                            return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.AccountAlreadyLinked);

                        if ((account.Type == EnumAccountType.Credit) != isCard)
                            return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.AccountTypeMismatch);

                        bankAccount.AccountId = account.Id;
                        Link(bankAccount, item.ImportFromDate ?? defaultStart);
                        anyLinked = true;
                        break;
                    }
                }
            }

            if (anyLinked)
                _context.PluggyWebhookEvents.Add(OpenFinanceSyncService.CreateInternalEvent(
                    OpenFinanceSyncService.InternalImportEvent, connection.ItemId));

            await _context.SaveChangesAsync(cancellationToken);
            return Result<BankConnectionResponseDto>.Success(await BuildResponseAsync(connection.Id, userId, cancellationToken));

            static void Link(BankConnectionAccount bankAccount, DateOnly importFrom)
            {
                bankAccount.Status = EnumBankAccountLinkStatus.Linked;
                bankAccount.ImportFromDate = importFrom;
                bankAccount.InitialImportCompletedAt = null;
            }
        }

        public async Task<Result<BankConnectionResponseDto>> SyncNowAsync(int userId, int connectionId, CancellationToken cancellationToken = default)
        {
            if (await CheckAccessAsync(userId, cancellationToken) is { } accessError)
                return Result<BankConnectionResponseDto>.Failure(accessError);

            var connection = await _context.BankConnections
                .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId
                    && c.Status != EnumBankConnectionStatus.Disconnected, cancellationToken);
            if (connection is null)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.ConnectionNotFound);

            if (connection.Status == EnumBankConnectionStatus.NeedsReconnect)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.ReconnectRequired);

            var now = DateTime.UtcNow;
            if (connection.LastManualSyncAt is { } last && now < last.AddMinutes(_settings.ManualSyncCooldownMinutes))
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.SyncCooldown);

            var result = await _pluggy.UpdateItemAsync(connection.ItemId, cancellationToken);
            var alreadyUpdating = result.StatusCode == 409 && result.ErrorCode == "ITEM_IS_ALREADY_UPDATING";
            if (!result.IsSuccess && !alreadyUpdating)
            {
                if (result.StatusCode == 409 || result.StatusCode == 429)
                    return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.SyncCooldown);
                return Result<BankConnectionResponseDto>.Failure(ProviderError(result.IsInconclusive));
            }

            // The outcome arrives by webhook (item/updated or item/error).
            connection.Status = EnumBankConnectionStatus.Syncing;
            connection.LastManualSyncAt = now;
            await _context.SaveChangesAsync(cancellationToken);

            return Result<BankConnectionResponseDto>.Success(await BuildResponseAsync(connection.Id, userId, cancellationToken));
        }

        public async Task<Result<List<BankConnectionResponseDto>>> DisconnectAsync(
            int userId, int connectionId, bool deleteTransactions, CancellationToken cancellationToken = default)
        {
            // No plan check: removing a connection must always be possible (LGPD, and
            // Pluggy requires it).
            var connection = await _context.BankConnections
                .Include(c => c.Accounts)
                .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId, cancellationToken);
            if (connection is null)
                return Result<List<BankConnectionResponseDto>>.Failure(OpenFinanceErrors.ConnectionNotFound);

            if (connection.Status != EnumBankConnectionStatus.Disconnected)
            {
                var result = await _pluggy.DeleteItemAsync(connection.ItemId, cancellationToken);
                if (!result.IsSuccess && result.StatusCode != 404)
                    return Result<List<BankConnectionResponseDto>>.Failure(ProviderError(result.IsInconclusive));
            }

            if (deleteTransactions)
            {
                var accountIds = connection.Accounts
                    .Where(a => a.AccountId != null)
                    .Select(a => a.AccountId!.Value)
                    .ToList();
                await DeleteSyncedTransactionsAsync(userId, accountIds, cancellationToken);
                await DeleteImportedInvestmentsAsync(userId, connection.Id, cancellationToken);
            }

            _context.BankConnections.Remove(connection);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<List<BankConnectionResponseDto>>.Success(await GetConnectionsAsync(userId, cancellationToken));
        }

        public async Task<Result<BankConnectionResponseDto>> AdjustBalanceAsync(
            int userId, int connectionId, AdjustBankBalanceRequestDto requestDto, CancellationToken cancellationToken = default)
        {
            var bankAccount = await _context.BankConnectionAccounts
                .FirstOrDefaultAsync(a => a.Id == requestDto.BankAccountId
                    && a.BankConnectionId == connectionId
                    && a.UserId == userId, cancellationToken);
            if (bankAccount is null)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.BankAccountNotFound);

            if (bankAccount.Status != EnumBankAccountLinkStatus.Linked || bankAccount.AccountId is not { } accountId)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.NothingToAdjust);

            var balances = await ComputeBalancesAsync(userId, [accountId], cancellationToken);
            var difference = BalanceDifference(bankAccount, balances.GetValueOrDefault(accountId));
            if (difference is null)
                return Result<BankConnectionResponseDto>.Failure(OpenFinanceErrors.NothingToAdjust);

            var subCategoryId = await BalanceUpdateSubCategoryHelper.GetIdAsync(_context, userId);

            // The first adjustment stands for the history before the import started, so it
            // is dated just before it; later ones (pending rows, bank corrections) today.
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var openingDate = bankAccount.ImportFromDate?.AddDays(-1);
            var hasAdjustment = await _context.Transactions.AnyAsync(t =>
                t.UserId == userId && t.AccountId == accountId && t.SubCategoryId == subCategoryId, cancellationToken);

            _context.Transactions.Add(new Transaction
            {
                UserId = userId,
                AccountId = accountId,
                SubCategoryId = subCategoryId,
                Value = Math.Abs(difference.Value),
                Type = difference.Value > 0 ? EnumTransactionType.Income : EnumTransactionType.Expense,
                PaymentType = EnumPaymentType.OneTime,
                TransactionDate = !hasAdjustment && openingDate is { } opening ? opening : today,
                Description = "Ajuste de saldo (Open Finance)"
            });
            await _context.SaveChangesAsync(cancellationToken);

            return Result<BankConnectionResponseDto>.Success(await BuildResponseAsync(connectionId, userId, cancellationToken));
        }

        public async Task RemoveAllConnectionsAsync(int userId, CancellationToken cancellationToken = default)
        {
            var connections = await _context.BankConnections
                .Where(c => c.UserId == userId)
                .ToListAsync(cancellationToken);
            if (connections.Count == 0)
                return;

            foreach (var connection in connections.Where(c => c.Status != EnumBankConnectionStatus.Disconnected))
            {
                var result = await _pluggy.DeleteItemAsync(connection.ItemId, cancellationToken);
                if (!result.IsSuccess && result.StatusCode != 404)
                    _logger.LogError(
                        "Could not delete Pluggy item {ItemId} of user {UserId} ({StatusCode}); delete it from the Pluggy dashboard.",
                        connection.ItemId, userId, result.StatusCode);
            }

            _context.BankConnections.RemoveRange(connections);
            await _context.SaveChangesAsync(cancellationToken);
        }

        /// <summary>
        /// Removes the portfolio positions this connection created (not the ones the user
        /// already had by hand), with the private assets that priced them.
        /// </summary>
        private async Task DeleteImportedInvestmentsAsync(int userId, int connectionId, CancellationToken cancellationToken)
        {
            var investments = await _context.BankConnectionInvestments
                .Where(l => l.UserId == userId && l.BankConnectionId == connectionId && l.InvestmentId != null
                    && (l.Status == EnumBankInvestmentLinkStatus.Active || l.Status == EnumBankInvestmentLinkStatus.Closed))
                .Select(l => l.Investment!)
                .Include(i => i.MarketAsset)
                .ToListAsync(cancellationToken);
            if (investments.Count == 0)
                return;

            var privateAssets = investments
                .Select(i => i.MarketAsset)
                .Where(a => a.OwnerUserId == userId)
                .ToList();

            _context.Investments.RemoveRange(investments);
            await _context.SaveChangesAsync(cancellationToken);
            _context.MarketAssets.RemoveRange(privateAssets);
        }

        private async Task DeleteSyncedTransactionsAsync(int userId, List<int> accountIds, CancellationToken cancellationToken)
        {
            if (accountIds.Count == 0)
                return;

            var synced = _context.Transactions.Where(t => t.UserId == userId
                && t.Source == EnumTransactionSource.OpenFinance
                && accountIds.Contains(t.AccountId));

            // Installments point at their first one with a restricting key; detach any row
            // (synced or not) hanging from a row about to go.
            await _context.Transactions
                .Where(t => t.UserId == userId && t.ParentTransactionId != null
                    && synced.Any(s => s.Id == t.ParentTransactionId))
                .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.ParentTransactionId, (int?)null), cancellationToken);

            await synced.ExecuteDeleteAsync(cancellationToken);
        }

        private async Task<BankConnectionResponseDto> BuildResponseAsync(int connectionId, int userId, CancellationToken cancellationToken)
        {
            var connection = await _context.BankConnections
                .AsNoTracking()
                .Include(c => c.Accounts)
                    .ThenInclude(a => a.Account)
                .FirstAsync(c => c.Id == connectionId && c.UserId == userId, cancellationToken);

            var linkedIds = connection.Accounts
                .Where(a => a.AccountId != null)
                .Select(a => a.AccountId!.Value)
                .ToList();
            var balances = await ComputeBalancesAsync(userId, linkedIds, cancellationToken);

            var now = DateTime.UtcNow;
            var syncAvailableAt = connection.LastManualSyncAt?.AddMinutes(_settings.ManualSyncCooldownMinutes);

            return new BankConnectionResponseDto
            {
                Id = connection.Id,
                ConnectorId = connection.ConnectorId,
                ConnectorName = connection.ConnectorName,
                ConnectorImageUrl = connection.ConnectorImageUrl,
                ConnectorPrimaryColor = connection.ConnectorPrimaryColor,
                Status = connection.Status,
                LastErrorMessage = connection.LastErrorMessage,
                LastSyncedAt = connection.LastSyncedAt,
                NextAutoSyncAt = connection.NextAutoSyncAt,
                ConsentExpiresAt = connection.ConsentExpiresAt,
                ConsentExpiringSoon = connection.ConsentExpiresAt is { } expires
                    && expires <= now.AddDays(_settings.ConsentExpiryNoticeDays),
                ManualSyncAvailableAt = syncAvailableAt > now ? syncAvailableAt : null,
                IsImporting = connection.Accounts.Any(a =>
                    a.Status == EnumBankAccountLinkStatus.Linked && a.InitialImportCompletedAt == null),
                CreatedAt = connection.CreatedAt,
                Accounts = connection.Accounts
                    .OrderBy(a => a.ExternalType)
                    .ThenBy(a => a.Name)
                    .Select(a =>
                    {
                        int? appBalance = a.AccountId is { } id ? balances.GetValueOrDefault(id) : null;
                        return new BankConnectionAccountResponseDto
                        {
                            Id = a.Id,
                            Name = a.Name,
                            Number = a.Number,
                            ExternalType = a.ExternalType,
                            ExternalSubtype = a.ExternalSubtype,
                            SuggestedAccountType = SuggestAccountType(a),
                            Status = a.Status,
                            AccountId = a.AccountId,
                            AccountName = a.Account?.Name,
                            ImportFromDate = a.ImportFromDate,
                            InitialImportCompletedAt = a.InitialImportCompletedAt,
                            ExternalBalance = a.ExternalBalance,
                            ExternalBalanceAt = a.ExternalBalanceAt,
                            ExternalCreditLimit = a.ExternalCreditLimit,
                            AppBalance = appBalance,
                            BalanceDifference = a.Status == EnumBankAccountLinkStatus.Linked
                                && a.InitialImportCompletedAt != null
                                && appBalance is { } balance
                                    ? BalanceDifference(a, balance)
                                    : null
                        };
                    })
                    .ToList()
            };
        }

        /// <summary>
        /// What to add to the app balance to match the bank's. A card's bank balance is the
        /// used limit, which the app holds as a negative balance (purchases are expenses).
        /// </summary>
        private static int? BalanceDifference(BankConnectionAccount bankAccount, int appBalance)
        {
            if (bankAccount.ExternalBalance is not { } external)
                return null;

            var target = IsCard(bankAccount) ? -external : external;
            var difference = target - appBalance;
            return difference == 0 ? null : difference;
        }

        // Same rule as the account list: income +, expense −, transfer − at the source and + at the destination.
        private async Task<Dictionary<int, int>> ComputeBalancesAsync(int userId, List<int> accountIds, CancellationToken cancellationToken)
        {
            if (accountIds.Count == 0)
                return [];

            var outgoing = await _context.Transactions
                .Where(t => t.UserId == userId && accountIds.Contains(t.AccountId))
                .GroupBy(t => t.AccountId)
                .Select(g => new
                {
                    AccountId = g.Key,
                    Sum = g.Sum(t => t.Type == EnumTransactionType.Income ? t.Value : -t.Value)
                })
                .ToListAsync(cancellationToken);

            var incoming = await _context.Transactions
                .Where(t => t.UserId == userId && t.Type == EnumTransactionType.Transfer
                    && t.DestinationAccountId != null && accountIds.Contains(t.DestinationAccountId.Value))
                .GroupBy(t => t.DestinationAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Sum = g.Sum(t => t.Value) })
                .ToListAsync(cancellationToken);

            var balances = accountIds.Distinct().ToDictionary(id => id, _ => 0);
            foreach (var row in outgoing)
                balances[row.AccountId] += row.Sum;
            foreach (var row in incoming)
                balances[row.AccountId] += row.Sum;
            return balances;
        }

        /// Null when the user may use bank connections; otherwise the error code. The number
        /// of banks is checked where a new one is added, not here.
        private async Task<string?> CheckAccessAsync(int userId, CancellationToken cancellationToken)
        {
            if (!IsAvailable)
                return OpenFinanceErrors.Unavailable;

            var entitlement = await GetEntitlementAsync(userId, cancellationToken);
            return entitlement.HasAccess ? null : OpenFinanceErrors.SubscriptionRequired;
        }

        private Task<OpenFinanceEntitlement> GetEntitlementAsync(int userId, CancellationToken cancellationToken) =>
            OpenFinanceEntitlement.GetAsync(_context, userId, _settings, _billingSettings, cancellationToken);

        private async Task<Guid> EnsureExternalRefAsync(int userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstAsync(u => u.Id == userId, cancellationToken);
            if (user.ExternalRef is { } existing)
                return existing;

            user.ExternalRef = Guid.NewGuid();
            await _context.SaveChangesAsync(cancellationToken);
            return user.ExternalRef.Value;
        }

        private static bool IsCard(BankConnectionAccount bankAccount) =>
            bankAccount.ExternalType.Equals("CREDIT", StringComparison.OrdinalIgnoreCase);

        private static EnumAccountType SuggestAccountType(BankConnectionAccount bankAccount)
        {
            if (IsCard(bankAccount))
                return EnumAccountType.Credit;
            return string.Equals(bankAccount.ExternalSubtype, "SAVINGS_ACCOUNT", StringComparison.OrdinalIgnoreCase)
                ? EnumAccountType.Savings
                : EnumAccountType.Checking;
        }

        private static string ProviderError(bool inconclusive) =>
            inconclusive ? OpenFinanceErrors.ProviderUnavailable : OpenFinanceErrors.ProviderRejected;
    }
}
