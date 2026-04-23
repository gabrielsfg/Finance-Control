using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Enums;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

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
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Name)
                .Select(a => new GetAccountItemResponseDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Type = a.Type,
                    CurrentAmount = _context.Transactions
                        .Where(t => t.AccountId == a.Id && t.UserId == userId)
                        .Sum(t => t.Type == EnumTransactionType.Income ? t.Value : -t.Value),
                    IsDefaultAccount = a.IsDefaultAccount
                })
                .ToListAsync();

            return accounts;
        }

        public async Task<GetAccountByIdResponseDto> GetAccountByIdAsync(int id, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id);

            if (account == null)
                return null;

            var currentAmount = await _context.Transactions
                .Where(t => t.AccountId == id && t.UserId == userId)
                .SumAsync(t => t.Type == EnumTransactionType.Income ? t.Value : -t.Value);

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
            account.CreditLimit = hasCreditFieldsUpdate ? requestDto.CreditLimit : null;

            await _context.SaveChangesAsync();

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
    }
}
