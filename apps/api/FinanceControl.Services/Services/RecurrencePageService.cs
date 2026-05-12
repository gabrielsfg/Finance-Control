using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class RecurrencePageService : IRecurrencePageService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

        public RecurrencePageService(IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<RecurrencePageResponseDto> GetPageAsync(int userId)
        {
            await using var context = _contextFactory.CreateDbContext();

            var recurring = await context.RecurringTransactions
                .Include(r => r.SubCategory).ThenInclude(s => s.Category)
                .Include(r => r.Account)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var installmentParents = await context.Transactions
                .Include(t => t.SubCategory).ThenInclude(s => s.Category)
                .Include(t => t.Account)
                .Include(t => t.Installments)
                .Where(t => t.UserId == userId
                         && t.PaymentType == EnumPaymentType.Installment
                         && t.ParentTransactionId == null
                         && t.TotalInstallments != null)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            var recurringDtos    = recurring.Select(MapRecurring).ToList();
            var installmentDtos  = installmentParents.Select(MapInstallment).ToList();

            var activeRecurring     = recurring.Where(r => r.IsActive).ToList();
            var activeInstallments  = installmentDtos.Where(i => i.RemainingInstallments > 0).ToList();

            int subscriptionMonthly = activeRecurring.Sum(r =>
                (int)Math.Round(r.Value * ToMonthlyFactor(r.Recurrence)));

            int installmentMonthly = activeInstallments.Sum(i => i.Value);

            return new RecurrencePageResponseDto
            {
                TotalMonthlyAmount        = subscriptionMonthly + installmentMonthly,
                SubscriptionMonthlyAmount = subscriptionMonthly,
                InstallmentMonthlyAmount  = installmentMonthly,
                ActiveRecurringCount      = activeRecurring.Count,
                ActiveInstallmentCount    = activeInstallments.Count,
                Recurring                 = recurringDtos,
                Installments              = installmentDtos,
            };
        }

        public async Task<RecurringTransactionResponseDto> CreateRecurringAsync(int userId, CreateRecurringTransactionRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            int? budgetId = null;
            if (dto.IncludeInBudget)
            {
                budgetId = await context.Budgets
                    .Where(b => b.IsActive && b.UserId == userId)
                    .Select(b => (int?)b.Id)
                    .FirstOrDefaultAsync();
            }

            var rt = new RecurringTransaction
            {
                UserId        = userId,
                BudgetId      = budgetId,
                SubCategoryId = dto.SubCategoryId,
                AccountId     = dto.AccountId,
                Value         = dto.Value,
                Type          = dto.Type,
                Description   = dto.Description,
                Recurrence    = dto.Recurrence,
                StartDate     = dto.StartDate,
                EndDate       = dto.EndDate,
                IsActive      = true,
            };

            context.RecurringTransactions.Add(rt);
            await context.SaveChangesAsync();

            var firstTransaction = new Transaction
            {
                UserId                 = userId,
                BudgetId               = budgetId,
                SubCategoryId          = dto.SubCategoryId,
                AccountId              = dto.AccountId,
                RecurringTransactionId = rt.Id,
                Value                  = dto.Value,
                Type                   = dto.Type,
                Description            = dto.Description,
                TransactionDate        = dto.StartDate,
                PaymentType            = EnumPaymentType.Recurring,
            };

            context.Transactions.Add(firstTransaction);
            await context.SaveChangesAsync();

            await context.Entry(rt).Reference(r => r.SubCategory).LoadAsync();
            await context.Entry(rt.SubCategory).Reference(s => s.Category).LoadAsync();
            await context.Entry(rt).Reference(r => r.Account).LoadAsync();

            return MapRecurring(rt);
        }

        public async Task<Result<RecurringTransactionResponseDto>> UpdateRecurringAsync(int userId, int id, UpdateRecurringTransactionRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var rt = await context.RecurringTransactions
                .Include(r => r.SubCategory).ThenInclude(s => s.Category)
                .Include(r => r.Account)
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (rt is null)
                return Result<RecurringTransactionResponseDto>.Failure("Recurring transaction not found.");

            if (dto.SubCategoryId > 0)      rt.SubCategoryId = dto.SubCategoryId;
            if (dto.AccountId > 0)           rt.AccountId     = dto.AccountId;
            if (dto.Value > 0)               rt.Value         = dto.Value;
            if (dto.Description is not null) rt.Description   = dto.Description;
            if (dto.EndDate.HasValue)        rt.EndDate        = dto.EndDate;

            await context.SaveChangesAsync();

            await context.Entry(rt).Reference(r => r.SubCategory).LoadAsync();
            await context.Entry(rt.SubCategory).Reference(s => s.Category).LoadAsync();
            await context.Entry(rt).Reference(r => r.Account).LoadAsync();

            return Result<RecurringTransactionResponseDto>.Success(MapRecurring(rt));
        }

        public async Task<Result<bool>> CancelRecurringAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var rt = await context.RecurringTransactions
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (rt is null)    return Result<bool>.Failure("Recurring transaction not found.");
            if (!rt.IsActive)  return Result<bool>.Failure("Recurring transaction is already inactive.");

            rt.IsActive = false;
            rt.EndDate  = DateOnly.FromDateTime(DateTime.UtcNow);
            await context.SaveChangesAsync();

            return Result<bool>.Success(true);
        }

        public async Task<Result<bool>> DeleteRecurringAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var rt = await context.RecurringTransactions
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (rt is null) return Result<bool>.Failure("Recurring transaction not found.");

            await context.Transactions
                .Where(t => t.RecurringTransactionId == id)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.RecurringTransactionId, (int?)null));

            context.RecurringTransactions.Remove(rt);
            await context.SaveChangesAsync();

            return Result<bool>.Success(true);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static decimal ToMonthlyFactor(EnumRecurrenceType freq) => freq switch
        {
            EnumRecurrenceType.Daily        => 30m,
            EnumRecurrenceType.WorkDay      => 22m,
            EnumRecurrenceType.Weekly       => 4.33m,
            EnumRecurrenceType.Biweekly     => 2.17m,
            EnumRecurrenceType.Monthly      => 1m,
            EnumRecurrenceType.Quarterly    => 1m / 3m,
            EnumRecurrenceType.Semiannually => 1m / 6m,
            EnumRecurrenceType.Annually     => 1m / 12m,
            _                               => 1m,
        };

        private static RecurringTransactionResponseDto MapRecurring(RecurringTransaction r) => new()
        {
            Id              = r.Id,
            SubCategoryId   = r.SubCategoryId,
            SubCategoryName = r.SubCategory?.Name ?? string.Empty,
            CategoryId      = r.SubCategory?.CategoryId ?? 0,
            CategoryName    = r.SubCategory?.Category?.Name ?? string.Empty,
            CategoryColor   = r.SubCategory?.Category?.Color,
            AccountId       = r.AccountId,
            AccountName     = r.Account?.Name ?? string.Empty,
            Value           = r.Value,
            Type            = r.Type,
            Description     = r.Description,
            Recurrence      = r.Recurrence,
            StartDate       = r.StartDate,
            EndDate         = r.EndDate,
            IsActive        = r.IsActive,
            CreatedAt       = r.CreatedAt,
            UpdatedAt       = r.UpdatedAt,
        };

        private static InstallmentSummaryResponseDto MapInstallment(Transaction t)
        {
            int total     = t.TotalInstallments ?? 1;
            int paid      = (t.Installments?.Count ?? 0) + 1;
            int remaining = Math.Max(0, total - paid);

            return new InstallmentSummaryResponseDto
            {
                Id                    = t.Id,
                SubCategoryId         = t.SubCategoryId,
                SubCategoryName       = t.SubCategory?.Name ?? string.Empty,
                CategoryId            = t.SubCategory?.CategoryId ?? 0,
                CategoryName          = t.SubCategory?.Category?.Name ?? string.Empty,
                CategoryColor         = t.SubCategory?.Category?.Color,
                AccountId             = t.AccountId,
                AccountName           = t.Account?.Name ?? string.Empty,
                Value                 = t.Value,
                TotalValue            = t.Value * total,
                Type                  = t.Type,
                Description           = t.Description,
                TransactionDate       = t.TransactionDate,
                TotalInstallments     = total,
                PaidInstallments      = paid,
                RemainingInstallments = remaining,
                RemainingAmount       = remaining * t.Value,
                PaymentMethod         = t.PaymentMethod,
            };
        }
    }
}
