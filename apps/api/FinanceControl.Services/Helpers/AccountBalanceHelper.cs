using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Helpers
{
    /// <summary>
    /// Account balances and the Open Finance "match the bank" adjustment, shared by the
    /// sync (automatic, after the first import) and the user's adjust button.
    /// </summary>
    public static class AccountBalanceHelper
    {
        public const string OpenFinanceAdjustmentDescription = "Ajuste de saldo (Open Finance)";

        // Same rule as the account list: income +, expense −, transfer − at the source and + at the destination.
        public static async Task<Dictionary<int, int>> ComputeAsync(
            ApplicationDbContext context, int userId, IReadOnlyCollection<int> accountIds, CancellationToken cancellationToken)
        {
            if (accountIds.Count == 0)
                return [];

            var outgoing = await context.Transactions
                .Where(t => t.UserId == userId && accountIds.Contains(t.AccountId))
                .GroupBy(t => t.AccountId)
                .Select(g => new
                {
                    AccountId = g.Key,
                    Sum = g.Sum(t => t.Type == EnumTransactionType.Income ? t.Value : -t.Value)
                })
                .ToListAsync(cancellationToken);

            var incoming = await context.Transactions
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

        public static bool IsCard(BankConnectionAccount bankAccount) =>
            bankAccount.ExternalType.Equals("CREDIT", StringComparison.OrdinalIgnoreCase);

        /// <summary>
        /// What to add to the app balance to match the bank's. A card's bank balance is the
        /// used limit, which the app holds as a negative balance (purchases are expenses).
        /// </summary>
        public static int? Difference(BankConnectionAccount bankAccount, int appBalance)
        {
            if (bankAccount.ExternalBalance is not { } external)
                return null;

            var target = IsCard(bankAccount) ? -external : external;
            var difference = target - appBalance;
            return difference == 0 ? null : difference;
        }

        /// <summary>
        /// Adds the transaction that makes a linked account match the bank, and returns
        /// whether there was anything to add. The first adjustment stands for the history
        /// before the import started, so it is dated just before it; later ones (bank
        /// corrections) today. Does not save.
        /// </summary>
        public static async Task<bool> AddBankAdjustmentAsync(
            ApplicationDbContext context, int userId, BankConnectionAccount bankAccount, CancellationToken cancellationToken)
        {
            if (bankAccount.AccountId is not { } accountId)
                return false;

            var balances = await ComputeAsync(context, userId, [accountId], cancellationToken);
            var difference = Difference(bankAccount, balances.GetValueOrDefault(accountId));
            if (difference is null)
                return false;

            var subCategoryId = await BalanceUpdateSubCategoryHelper.GetIdAsync(context, userId);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var openingDate = bankAccount.ImportFromDate?.AddDays(-1);
            var hasAdjustment = await context.Transactions.AnyAsync(t =>
                t.UserId == userId && t.AccountId == accountId && t.SubCategoryId == subCategoryId, cancellationToken);

            if (hasAdjustment || openingDate is not { } opening)
            {
                Add(difference.Value, today);
                return true;
            }

            if (IsCard(bankAccount) && difference.Value < 0)
            {
                // A card's missing history is the bill the first imported payments pay; the
                // rest of the gap is in the open bill (a purchase the bank counts and has not
                // shared yet). Dating it all before the start would show it as an unpaid bill.
                var owed = -difference.Value;
                var paid = await FirstBillPaymentsAsync(context, userId, accountId, bankAccount.ImportFromDate!.Value, cancellationToken);
                var history = Math.Min(owed, paid);
                if (history > 0)
                    Add(-history, opening);
                if (owed - history > 0)
                    Add(-(owed - history), today);
                return true;
            }

            Add(difference.Value, opening);
            return true;

            void Add(int amount, DateOnly date) => context.Transactions.Add(new Transaction
            {
                UserId = userId,
                AccountId = accountId,
                SubCategoryId = subCategoryId,
                Value = Math.Abs(amount),
                Type = amount > 0 ? EnumTransactionType.Income : EnumTransactionType.Expense,
                PaymentType = EnumPaymentType.OneTime,
                TransactionDate = date,
                Description = OpenFinanceAdjustmentDescription
            });
        }

        /// Payments and credits on a card in its first bill cycle after the import start
        /// (the bill closing then was already open before the start).
        private static async Task<int> FirstBillPaymentsAsync(
            ApplicationDbContext context, int userId, int accountId, DateOnly start, CancellationToken cancellationToken)
        {
            var closingDay = await context.Accounts
                .Where(a => a.UserId == userId && a.Id == accountId)
                .Select(a => a.BillingClosingDay)
                .FirstOrDefaultAsync(cancellationToken);

            var end = start.AddDays(31);
            if (closingDay is { } day)
            {
                var candidate = new DateOnly(start.Year, start.Month, Math.Min(day, DateTime.DaysInMonth(start.Year, start.Month)));
                if (candidate <= start)
                {
                    var next = start.AddMonths(1);
                    candidate = new DateOnly(next.Year, next.Month, Math.Min(day, DateTime.DaysInMonth(next.Year, next.Month)));
                }
                end = candidate;
            }

            var income = await context.Transactions
                .Where(t => t.UserId == userId && t.AccountId == accountId && t.Type == EnumTransactionType.Income
                    && t.TransactionDate >= start && t.TransactionDate < end)
                .SumAsync(t => (int?)t.Value, cancellationToken) ?? 0;
            var transfersIn = await context.Transactions
                .Where(t => t.UserId == userId && t.Type == EnumTransactionType.Transfer && t.DestinationAccountId == accountId
                    && t.TransactionDate >= start && t.TransactionDate < end)
                .SumAsync(t => (int?)t.Value, cancellationToken) ?? 0;
            return income + transfersIn;
        }
    }
}
