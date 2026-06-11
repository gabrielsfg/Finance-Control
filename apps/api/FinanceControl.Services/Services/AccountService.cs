using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Enums;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace FinanceControl.Services.Services
{
    public class AccountService : IAccountService
    {
        private readonly ApplicationDbContext _context;

        public AccountService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetAccountItemResponseDto>>> CreateAccountAsync(CreateAccountRequestDto requestDto, int userId)
        {
            var hasCreditFields = requestDto.Type == EnumAccountType.Credit || requestDto.Type == EnumAccountType.Checking;
            var account = new Account()
            {
                UserId = userId,
                Name = requestDto.Name,
                Type = requestDto.Type,
                GoalAmount = requestDto.GoalAmount,
                IsDefaultAccount = requestDto.IsDefaultAccount,
                BillingDueDay = hasCreditFields ? requestDto.BillingDueDay : null,
                // Closing day is a credit-card concept only (not checking).
                BillingClosingDay = requestDto.Type == EnumAccountType.Credit ? requestDto.BillingClosingDay : null,
                CreditLimit = hasCreditFields ? requestDto.CreditLimit : null,
            };

            var hasAnyAccount = await _context.Accounts.AnyAsync(a => a.UserId == userId);
            if (!hasAnyAccount)
            {
                account.IsDefaultAccount = true;
            }
            else if (account.IsDefaultAccount)
            {
                var currentDefault = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefaultAccount == true);
                if (currentDefault != null)
                    currentDefault.IsDefaultAccount = false;
            }

            await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();

            if (requestDto.InitialBalance.HasValue && requestDto.InitialBalance.Value != 0)
            {
                var otherIncomeSubCategoryId = await _context.SubCategories
                    .Where(s => s.UserId == userId &&
                                (s.Name == "Other income" || s.Name == "Outras receitas"))
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync();

                if (otherIncomeSubCategoryId.HasValue)
                {
                    var isExpense = requestDto.InitialBalance.Value < 0;
                    _context.Transactions.Add(new Transaction
                    {
                        UserId = userId,
                        AccountId = account.Id,
                        SubCategoryId = otherIncomeSubCategoryId.Value,
                        Value = Math.Abs(requestDto.InitialBalance.Value),
                        Type = isExpense ? EnumTransactionType.Expense : EnumTransactionType.Income,
                        PaymentType = EnumPaymentType.OneTime,
                        TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        Description = "Initial balance",
                    });
                    await _context.SaveChangesAsync();
                }
            }

            var accounts = await GetAllAccountAsync(userId);
            return Result<IEnumerable<GetAccountItemResponseDto>>.Success(accounts);
        }

        public async Task<IEnumerable<GetAccountItemResponseDto>> GetAllAccountAsync(int userId)
        {
            var accounts = await _context.Accounts
                .Where(a => a.UserId == userId && !a.IsSystem)
                .OrderBy(a => a.Name)
                .Select(a => new GetAccountItemResponseDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Type = a.Type,
                    CurrentAmount =
                        _context.Transactions
                            .Where(t => t.AccountId == a.Id && t.UserId == userId)
                            .Sum(t => t.Type == EnumTransactionType.Income  ?  t.Value
                                    : t.Type == EnumTransactionType.Expense ? -t.Value
                                    : t.Type == EnumTransactionType.Transfer ? -t.Value
                                    : 0) +
                        _context.Transactions
                            .Where(t => t.DestinationAccountId == a.Id && t.UserId == userId && t.Type == EnumTransactionType.Transfer)
                            .Sum(t => (int?)t.Value) ?? 0,
                    IsDefaultAccount = a.IsDefaultAccount,
                    CreditLimit = a.CreditLimit
                })
                .ToListAsync();

            return accounts;
        }

        public async Task<GetAccountByIdResponseDto> GetAccountByIdAsync(int id, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id && !a.IsSystem);

            if (account == null)
                return null;

            var outbound = await _context.Transactions
                .Where(t => t.AccountId == id && t.UserId == userId)
                .SumAsync(t => t.Type == EnumTransactionType.Income  ?  t.Value
                             : t.Type == EnumTransactionType.Expense ? -t.Value
                             : -t.Value); // Transfer out
            var inbound = await _context.Transactions
                .Where(t => t.DestinationAccountId == id && t.UserId == userId && t.Type == EnumTransactionType.Transfer)
                .SumAsync(t => (int?)t.Value) ?? 0;
            var currentAmount = outbound + inbound;

            var rawTransactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.AccountId == id)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .Take(5)
                .Select(t => new
                {
                    t.Id,
                    t.Description,
                    t.Value,
                    t.Type,
                    SubCategoryName = t.SubCategory.Name,
                    SubCategoryEmoji = t.SubCategory.Emoji,
                    CategoryName = t.SubCategory.Category.Name
                })
                .ToListAsync();

            var recentTransactions = rawTransactions.Select(t => new RecentTransactionDto
            {
                Id = t.Id,
                Description = t.Description,
                Value = t.Value,
                Type = t.Type,
                SubCategoryName = t.SubCategoryName,
                SubCategoryEmoji = t.SubCategoryEmoji,
                CategoryName = t.CategoryName
            }).ToList();

            return new GetAccountByIdResponseDto
            {
                Id = account.Id,
                Name = account.Name,
                Type = account.Type,
                CurrentAmount = currentAmount,
                GoalAmount = account.GoalAmount,
                IsDefaultAccount = account.IsDefaultAccount,
                BillingDueDay = account.BillingDueDay,
                BillingClosingDay = account.BillingClosingDay,
                CreditLimit = account.CreditLimit,
                RecentTransactions = recentTransactions
            };
        }

        public async Task<Result<IEnumerable<GetAccountItemResponseDto>>> UpdateAccountAsync(UpdateAccountRequestDto requestDto, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == requestDto.Id);

            if (account == null)
                return Result<IEnumerable<GetAccountItemResponseDto>>.Failure("Account not found.");

            var hasCreditFieldsUpdate = requestDto.Type == EnumAccountType.Credit || requestDto.Type == EnumAccountType.Checking;
            account.Name = requestDto.Name;
            account.Type = requestDto.Type;
            account.GoalAmount = requestDto.GoalAmount;
            account.IsDefaultAccount = requestDto.IsDefaultAccount;
            account.BillingDueDay = hasCreditFieldsUpdate ? requestDto.BillingDueDay : null;
            account.BillingClosingDay = requestDto.Type == EnumAccountType.Credit ? requestDto.BillingClosingDay : null;
            account.CreditLimit = hasCreditFieldsUpdate ? requestDto.CreditLimit : null;

            await _context.SaveChangesAsync();

            if (requestDto.NewBalance.HasValue)
            {
                var outSum = await _context.Transactions
                    .Where(t => t.AccountId == account.Id && t.UserId == userId)
                    .SumAsync(t => t.Type == EnumTransactionType.Income  ?  t.Value
                                 : t.Type == EnumTransactionType.Expense ? -t.Value
                                 : -t.Value);
                var inSum = await _context.Transactions
                    .Where(t => t.DestinationAccountId == account.Id && t.UserId == userId && t.Type == EnumTransactionType.Transfer)
                    .SumAsync(t => (int?)t.Value) ?? 0;
                var currentBalance = outSum + inSum;

                var diff = requestDto.NewBalance.Value - currentBalance;
                if (diff != 0)
                {
                    var subCategoryId = await _context.SubCategories
                        .Where(s => s.UserId == userId &&
                                    (diff > 0
                                        ? (s.Name == "Other income" || s.Name == "Outras receitas")
                                        : (s.Name == "Other expense" || s.Name == "Outras despesas")))
                        .Select(s => (int?)s.Id)
                        .FirstOrDefaultAsync();

                    if (subCategoryId.HasValue)
                    {
                        _context.Transactions.Add(new Transaction
                        {
                            UserId = userId,
                            AccountId = account.Id,
                            SubCategoryId = subCategoryId.Value,
                            Value = Math.Abs(diff),
                            Type = diff > 0 ? EnumTransactionType.Income : EnumTransactionType.Expense,
                            PaymentType = EnumPaymentType.OneTime,
                            TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                            Description = "Balance adjustment",
                        });
                        await _context.SaveChangesAsync();
                    }
                }
            }

            var accounts = await GetAllAccountAsync(userId);
            return Result<IEnumerable<GetAccountItemResponseDto>>.Success(accounts);
        }

        public async Task<Result<IEnumerable<GetAccountItemResponseDto>>> DeleteAccountByIdAsync(int id, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id);

            if (account == null)
                return Result<IEnumerable<GetAccountItemResponseDto>>.Failure("Account not found.");

            _context.Remove(account);
            await _context.SaveChangesAsync();

            var accounts = await GetAllAccountAsync(userId);
            return Result<IEnumerable<GetAccountItemResponseDto>>.Success(accounts);
        }

        public async Task<IEnumerable<BalanceHistoryItemDto>?> GetBalanceHistoryAsync(int accountId, int userId, int days = 30)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId && !a.IsSystem);
            if (account == null)
                return null;

            var cutoff = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-(days - 1));

            var outbound = await _context.Transactions
                .Where(t => t.AccountId == accountId && t.UserId == userId)
                .Select(t => new { t.TransactionDate, t.Value, t.Type, Direction = 1 })
                .ToListAsync();

            var inbound = await _context.Transactions
                .Where(t => t.DestinationAccountId == accountId && t.UserId == userId && t.Type == EnumTransactionType.Transfer)
                .Select(t => new { t.TransactionDate, t.Value, t.Type, Direction = 2 })
                .ToListAsync();

            int Delta(int value, EnumTransactionType type, int direction) =>
                direction == 2 ? value :
                type == EnumTransactionType.Income ? value : -value;

            // Balance before the window
            var baseBalance =
                outbound.Where(t => t.TransactionDate < cutoff).Sum(t => Delta(t.Value, t.Type, t.Direction)) +
                inbound.Where(t => t.TransactionDate < cutoff).Sum(t => Delta(t.Value, t.Type, t.Direction));

            var allInWindow = outbound.Where(t => t.TransactionDate >= cutoff)
                .Select(t => (t.TransactionDate, Delta: Delta(t.Value, t.Type, t.Direction)))
                .Concat(inbound.Where(t => t.TransactionDate >= cutoff)
                    .Select(t => (t.TransactionDate, Delta: Delta(t.Value, t.Type, t.Direction))))
                .ToList();

            var dailyDeltas = allInWindow
                .GroupBy(t => t.TransactionDate)
                .ToDictionary(g => g.Key, g => g.Sum(t => t.Delta));

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var result = new List<BalanceHistoryItemDto>(days);
            var running = baseBalance;

            for (var d = cutoff; d <= today; d = d.AddDays(1))
            {
                if (dailyDeltas.TryGetValue(d, out var delta))
                    running += delta;

                result.Add(new BalanceHistoryItemDto { Date = d, Balance = running });
            }

            return result;
        }
    }
}
