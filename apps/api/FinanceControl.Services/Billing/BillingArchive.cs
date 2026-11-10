using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Billing
{
    /// <summary>
    /// What of the billing outlives a deleted account: the charges that moved money (tax
    /// and consumer-protection periods) and the CPF hash of a trial already used.
    /// </summary>
    public static class BillingArchive
    {
        /// <summary>
        /// Copies the account's paid charges into <see cref="BillingRecord"/> and records its
        /// trial in <see cref="TrialUsage"/>. Does not save: the caller saves together with
        /// the deletion, so a failed deletion leaves no copy behind.
        /// </summary>
        public static async Task AddForDeletedAccountAsync(
            ApplicationDbContext context, int userId, CancellationToken cancellationToken = default)
        {
            var profile = await context.BillingProfiles.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

            var charges = await context.SubscriptionCharges.AsNoTracking()
                .Where(c => c.UserId == userId && c.ConfirmedAt != null)
                .ToListAsync(cancellationToken);

            foreach (var charge in charges)
            {
                context.BillingRecords.Add(new BillingRecord
                {
                    FormerUserId = userId,
                    AsaasCustomerId = profile?.AsaasCustomerId,
                    CpfHash = profile?.CpfHash,
                    Plan = charge.Plan,
                    Cycle = charge.Cycle,
                    BillingMethod = charge.BillingMethod,
                    InstallmentCount = charge.InstallmentCount,
                    Amount = charge.Amount,
                    RefundedAmount = charge.RefundedAmount,
                    Status = charge.Status,
                    PeriodStart = charge.PeriodStart,
                    PeriodEnd = charge.PeriodEnd,
                    DueDate = charge.DueDate,
                    ConfirmedAt = charge.ConfirmedAt,
                    RefundedAt = charge.RefundedAt,
                    AsaasPaymentId = charge.AsaasPaymentId,
                    AsaasInstallmentId = charge.AsaasInstallmentId,
                    AsaasInvoiceId = charge.AsaasInvoiceId,
                    InvoicePdfUrl = charge.InvoicePdfUrl
                });
            }

            // Trials granted before TrialUsages existed are only on the profile. The trial
            // belongs to the account holder's CPF; old accounts only have the payer's.
            var accountCpfHash = await context.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.CpfHash)
                .FirstOrDefaultAsync(cancellationToken);
            var trialCpfHash = accountCpfHash ?? profile?.CpfHash;

            if (profile is { TrialConsumedAt: not null } && trialCpfHash is not null
                && !await context.TrialUsages.AnyAsync(t => t.CpfHash == trialCpfHash, cancellationToken)
                && !context.TrialUsages.Local.Any(t => t.CpfHash == trialCpfHash))
            {
                context.TrialUsages.Add(new TrialUsage { CpfHash = trialCpfHash, UsedAt = profile.TrialConsumedAt.Value });
            }
        }
    }
}
