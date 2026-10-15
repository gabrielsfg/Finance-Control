using System.Text.RegularExpressions;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Pluggy;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Brings the investment positions of a bank connection into the user's portfolio.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Open Finance reports what the user holds today, not how they got there, so the
    /// portfolio receives the position as operations it can work with:
    /// </para>
    /// <list type="bullet">
    /// <item><b>Listed assets</b> (a stock, an FII, an ETF the bank names by ticker) use the
    /// shared market asset and its market price. The first sync records one purchase of the
    /// whole quantity; later syncs record the change in quantity as a purchase or a sale.</item>
    /// <item><b>Everything else</b> (CDB, LCI, Tesouro, funds, pension plans) has no quote
    /// anywhere, so it lives in a private asset priced with the bank's own net balance. The
    /// position is one unit worth the balance, bought for the amount the bank says was
    /// invested; that one purchase is kept equal to the invested amount on every sync.</item>
    /// </list>
    /// <para>
    /// The user's own entries win: a listed asset they already hold by hand is not added on
    /// top of their position, and a position they delete is not brought back.
    /// </para>
    /// </remarks>
    public class OpenFinanceInvestmentSyncService
    {
        public const string PrivateTickerPrefix = "OF-";

        private static readonly Regex B3Ticker = new(@"^[A-Z]{4}\d{1,2}[A-Z]?$", RegexOptions.Compiled);

        private readonly ApplicationDbContext _context;
        private readonly PluggyClient _pluggy;
        private readonly ILogger<OpenFinanceInvestmentSyncService> _logger;

        public OpenFinanceInvestmentSyncService(
            ApplicationDbContext context,
            PluggyClient pluggy,
            ILogger<OpenFinanceInvestmentSyncService> logger)
        {
            _context = context;
            _pluggy = pluggy;
            _logger = logger;
        }

        public async Task SyncAsync(BankConnection connection, CancellationToken cancellationToken)
        {
            // Wait until the user has decided where the accounts go: the positions need one
            // of them as their cash account, and importing before the setup is finished
            // would put things in the portfolio the user has not looked at yet.
            if (connection.Accounts.Count == 0 || connection.Accounts.Any(a => a.Status == EnumBankAccountLinkStatus.PendingLink))
                return;

            var result = await _pluggy.ListInvestmentsAsync(connection.ItemId, cancellationToken);
            if (!result.IsSuccess)
            {
                // 403: the investments product is not part of the Pluggy subscription.
                if (result.StatusCode is 403 or 404)
                {
                    _logger.LogInformation("Investments unavailable for item {ItemId} ({StatusCode}).", connection.ItemId, result.StatusCode);
                    return;
                }
                throw new InvalidOperationException($"Pluggy investment listing failed ({result.StatusCode} {result.ErrorCode}).");
            }

            var cashAccountId = await ResolveCashAccountAsync(connection, cancellationToken);
            if (cashAccountId is null)
                return;

            var userId = connection.UserId;
            var links = await _context.BankConnectionInvestments
                .Include(l => l.Investment).ThenInclude(i => i!.MarketAsset)
                .Include(l => l.Investment).ThenInclude(i => i!.Transactions)
                .Where(l => l.BankConnectionId == connection.Id && l.UserId == userId)
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            var today = DateOnly.FromDateTime(now);
            var seen = new HashSet<string>();

            foreach (var position in result.Value!.Where(p => !string.IsNullOrEmpty(p.Id)))
            {
                seen.Add(position.Id);
                var link = links.FirstOrDefault(l => l.ExternalInvestmentId == position.Id);
                var isNew = link is null;
                if (link is null)
                {
                    link = new BankConnectionInvestment
                    {
                        UserId = userId,
                        BankConnectionId = connection.Id,
                        ExternalInvestmentId = Truncate(position.Id, 100)
                    };
                    _context.BankConnectionInvestments.Add(link);
                    links.Add(link);
                }

                var previousAmountOriginal = link.AmountOriginal;
                link.Name = Truncate(position.Name ?? position.Code ?? "Investimento", 200);
                link.Code = TruncateOrNull(position.Code?.Trim().ToUpperInvariant(), 40);
                link.ExternalType = Truncate(position.Type ?? "OTHER", 30);
                link.ExternalSubtype = TruncateOrNull(position.Subtype, 60);
                link.Balance = Cents(position.Balance ?? position.Amount);
                link.AmountOriginal = Cents(position.AmountOriginal);
                link.Quantity = position.Quantity;
                link.LastSyncedAt = now;

                if (link.Status is EnumBankInvestmentLinkStatus.Dismissed or EnumBankInvestmentLinkStatus.MatchedExisting)
                    continue;

                // The position existed and its portfolio entry is gone: the user deleted it.
                if (!isNew && link.InvestmentId is null && link.Status == EnumBankInvestmentLinkStatus.Active)
                {
                    link.Status = EnumBankInvestmentLinkStatus.Dismissed;
                    continue;
                }

                var closed = string.Equals(position.Status, "TOTAL_WITHDRAWAL", StringComparison.OrdinalIgnoreCase)
                    || ((position.Balance ?? position.Amount ?? 0) <= 0 && (position.Quantity ?? 0) <= 0);
                if (closed)
                {
                    Close(link, today);
                    continue;
                }

                if (link.Status == EnumBankInvestmentLinkStatus.Closed)
                    link.Status = EnumBankInvestmentLinkStatus.Active;

                await ApplyAsync(link, position, previousAmountOriginal, userId, cashAccountId.Value, connection.ConnectorName, now, cancellationToken);
            }

            // Positions the bank stopped reporting were redeemed.
            foreach (var link in links.Where(l => l.Status == EnumBankInvestmentLinkStatus.Active && !seen.Contains(l.ExternalInvestmentId)))
                Close(link, today);

            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task ApplyAsync(
            BankConnectionInvestment link,
            PluggyInvestment position,
            long? previousAmountOriginal,
            int userId,
            int cashAccountId,
            string bankName,
            DateTime now,
            CancellationToken cancellationToken)
        {
            var today = DateOnly.FromDateTime(now);
            var assetType = MapAssetType(position);
            var ticker = ListedTicker(position, assetType);
            var balance = Cents(position.Balance ?? position.Amount) ?? 0;
            var invested = Cents(position.AmountOriginal);

            var investment = link.Investment;
            if (investment is null)
            {
                MarketAsset asset;
                decimal quantity;
                long averagePrice;

                if (ticker is not null && position.Quantity is > 0)
                {
                    asset = await _context.MarketAssets.FirstOrDefaultAsync(a => a.Ticker == ticker && a.OwnerUserId == null, cancellationToken)
                        ?? AddListedAsset(ticker, position, assetType);

                    var manual = await _context.Investments
                        .FirstOrDefaultAsync(i => i.UserId == userId && i.MarketAssetId == asset.Id, cancellationToken);
                    if (manual is not null)
                    {
                        // The user tracks this asset by hand; their numbers stay.
                        link.InvestmentId = manual.Id;
                        link.Status = EnumBankInvestmentLinkStatus.MatchedExisting;
                        return;
                    }

                    quantity = position.Quantity.Value;
                    averagePrice = invested is > 0
                        ? (long)Math.Round(invested.Value / quantity)
                        : UnitPrice(position, quantity, balance);
                    if (asset.LastPriceUpdate is null)
                        asset.CurrentPrice = UnitPrice(position, quantity, balance);
                }
                else
                {
                    asset = new MarketAsset
                    {
                        Ticker = await NewPrivateTickerAsync(cancellationToken),
                        Name = link.Name,
                        AssetType = assetType,
                        CurrentPrice = balance,
                        LastPriceUpdate = now,
                        Currency = string.IsNullOrWhiteSpace(position.CurrencyCode) ? "BRL" : position.CurrencyCode!,
                        OwnerUserId = userId
                    };
                    _context.MarketAssets.Add(asset);
                    quantity = 1;
                    averagePrice = invested is > 0 ? invested.Value : balance;
                }

                investment = new Investment
                {
                    UserId = userId,
                    MarketAsset = asset,
                    Broker = Truncate(bankName, 100),
                    CurrentQuantity = quantity,
                    AveragePrice = averagePrice,
                    AccountId = cashAccountId,
                    MaturityDate = position.DueDate is { } due ? DateOnly.FromDateTime(due) : null
                };
                _context.Investments.Add(investment);
                investment.Transactions.Add(Operation(userId, EnumInvestmentOperation.Buy,
                    position.IssueDate is { } issued ? DateOnly.FromDateTime(issued) : today, quantity, averagePrice));

                link.Investment = investment;
                link.Status = EnumBankInvestmentLinkStatus.Active;
                return;
            }

            var current = investment.MarketAsset;
            if (current.OwnerUserId == userId)
            {
                // Private position: one unit worth the balance, bought for what was invested.
                current.CurrentPrice = balance;
                current.LastPriceUpdate = now;
                current.Name = link.Name;
                var newAverage = invested is > 0 ? invested.Value : investment.AveragePrice;

                if (investment.CurrentQuantity <= 0)
                {
                    investment.CurrentQuantity = 1;
                    investment.AveragePrice = newAverage;
                    investment.Transactions.Add(Operation(userId, EnumInvestmentOperation.Buy, today, 1, newAverage));
                }
                else if (newAverage != investment.AveragePrice)
                {
                    investment.AveragePrice = newAverage;
                    if (investment.Transactions.Count == 1 && investment.Transactions.First() is { Operation: EnumInvestmentOperation.Buy } purchase)
                    {
                        purchase.UnitPrice = newAverage;
                        purchase.TotalValue = (long)Math.Round(purchase.Quantity * newAverage);
                    }
                }

                investment.MaturityDate = position.DueDate is { } dueDate ? DateOnly.FromDateTime(dueDate) : investment.MaturityDate;
                return;
            }

            // Listed position: follow the quantity; the market prices it.
            var newQuantity = position.Quantity ?? investment.CurrentQuantity;
            var delta = newQuantity - investment.CurrentQuantity;
            if (delta == 0)
                return;

            var unit = UnitPrice(position, newQuantity, balance);
            if (delta > 0)
            {
                // The new money over the new units, when the bank reports what was invested.
                var addedCost = invested is > 0 && previousAmountOriginal is > 0 && invested > previousAmountOriginal
                    ? invested.Value - previousAmountOriginal.Value
                    : (long)Math.Round(delta * unit);
                var buyUnit = (long)Math.Round(addedCost / delta);
                investment.Transactions.Add(Operation(userId, EnumInvestmentOperation.Buy, today, delta, buyUnit));
                var totalCost = investment.CurrentQuantity * investment.AveragePrice + delta * buyUnit;
                investment.CurrentQuantity = newQuantity;
                investment.AveragePrice = newQuantity > 0 ? (long)Math.Round(totalCost / newQuantity) : 0;
            }
            else
            {
                investment.Transactions.Add(Operation(userId, EnumInvestmentOperation.Sell, today, -delta, unit));
                investment.CurrentQuantity = Math.Max(0, newQuantity);
            }
        }

        /// The bank reports the position redeemed: sell what the portfolio still holds.
        private static void Close(BankConnectionInvestment link, DateOnly today)
        {
            link.Status = EnumBankInvestmentLinkStatus.Closed;
            var investment = link.Investment;
            if (investment is null || investment.CurrentQuantity <= 0)
                return;

            var unit = investment.MarketAsset.CurrentPrice;
            investment.Transactions.Add(Operation(investment.UserId, EnumInvestmentOperation.Sell, today, investment.CurrentQuantity, unit));
            investment.CurrentQuantity = 0;
        }

        private static InvestmentTransaction Operation(int userId, EnumInvestmentOperation operation, DateOnly date, decimal quantity, long unitPrice) => new()
        {
            UserId = userId,
            Operation = operation,
            Date = date,
            Quantity = quantity,
            UnitPrice = unitPrice,
            OtherCosts = 0,
            TotalValue = (long)Math.Round(quantity * unitPrice)
        };

        private MarketAsset AddListedAsset(string ticker, PluggyInvestment position, EnumAssetType assetType)
        {
            var asset = new MarketAsset
            {
                Ticker = ticker,
                Name = Truncate(position.Name ?? ticker, 200),
                AssetType = assetType,
                CurrentPrice = 0,
                Currency = string.IsNullOrWhiteSpace(position.CurrencyCode) ? "BRL" : position.CurrencyCode!
            };
            _context.MarketAssets.Add(asset);
            return asset;
        }

        /// <summary>
        /// The cash account the positions are attached to: a linked checking or savings
        /// account of the same bank, otherwise the user's default account.
        /// </summary>
        private async Task<int?> ResolveCashAccountAsync(BankConnection connection, CancellationToken cancellationToken)
        {
            var linked = connection.Accounts
                .Where(a => a.Status == EnumBankAccountLinkStatus.Linked && a.AccountId != null
                    && !a.ExternalType.Equals("CREDIT", StringComparison.OrdinalIgnoreCase))
                .Select(a => a.AccountId)
                .FirstOrDefault();
            if (linked is not null)
                return linked;

            return await _context.Accounts
                .Where(a => a.UserId == connection.UserId && !a.IsSystem && a.Type != EnumAccountType.Credit)
                .OrderByDescending(a => a.IsDefaultAccount)
                .ThenBy(a => a.Id)
                .Select(a => (int?)a.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<string> NewPrivateTickerAsync(CancellationToken cancellationToken)
        {
            while (true)
            {
                var ticker = PrivateTickerPrefix + Guid.NewGuid().ToString("N")[..10].ToUpperInvariant();
                if (!await _context.MarketAssets.AnyAsync(a => a.Ticker == ticker, cancellationToken))
                    return ticker;
            }
        }

        /// The ticker to price a position by, or null when it must be a private asset.
        private static string? ListedTicker(PluggyInvestment position, EnumAssetType assetType)
        {
            if (assetType is not (EnumAssetType.Acao or EnumAssetType.FII or EnumAssetType.BDR or EnumAssetType.ETF))
                return null;

            var code = position.Code?.Trim().ToUpperInvariant();
            return code is not null && B3Ticker.IsMatch(code) ? code : null;
        }

        public static EnumAssetType MapAssetType(PluggyInvestment position)
        {
            var type = (position.Type ?? string.Empty).ToUpperInvariant();
            var subtype = (position.Subtype ?? string.Empty).ToUpperInvariant();

            if (subtype == "REAL_ESTATE_FUND")
                return EnumAssetType.FII;

            return type switch
            {
                "EQUITY" => subtype == "BDR" ? EnumAssetType.BDR : EnumAssetType.Acao,
                "ETF" => EnumAssetType.ETF,
                "MUTUAL_FUND" => EnumAssetType.FundoInvestimento,
                "FIXED_INCOME" => subtype.Contains("TREASURY") || subtype is "LTN" or "LFT" or "NTN" or "NTNB" or "NTNF"
                    ? EnumAssetType.TesouroDireto
                    : EnumAssetType.RendaFixa,
                _ => EnumAssetType.Outro
            };
        }

        private static long UnitPrice(PluggyInvestment position, decimal quantity, long balance)
        {
            if (position.Value is > 0)
                return Cents(position.Value)!.Value;
            return quantity > 0 ? (long)Math.Round(balance / quantity) : balance;
        }

        private static long? Cents(decimal? amount) =>
            amount is { } value ? (long)Math.Round(value * 100m, MidpointRounding.AwayFromZero) : null;

        private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

        private static string? TruncateOrNull(string? value, int max) =>
            string.IsNullOrEmpty(value) ? null : Truncate(value, max);
    }
}
