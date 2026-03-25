using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Enums;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            var account = new Account()
            {
                UserId = userId,
                Name = requestDto.Name,
                CurrentBalance = requestDto.CurrentBalance,
                GoalAmount = requestDto.GoalAmount,
                IsDefaultAccount = requestDto.IsDefaultAccount
            };

            var hasAnyAccount = await _context.Accounts.AnyAsync(a => a.UserId == userId);
            if (!hasAnyAccount)
            { 
                account.IsDefaultAccount = true; 
            } else if (account.IsDefaultAccount)
            {
                var currentDefault = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefaultAccount == true);

                if (currentDefault != null)
                    currentDefault.IsDefaultAccount = false;
            }

            await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();

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
                    CurrentAmount = a.CurrentBalance,
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

            return new GetAccountByIdResponseDto()
            {
                Id = account.Id,
                Name = account.Name,
                CurrentAmount = account.CurrentBalance,
                GoalAmount = account.GoalAmount,
                IsDefaultAccount = account.IsDefaultAccount,
                RecentTransactions = recentTransactions
            };
        }

        public async Task<Result<IEnumerable<GetAccountItemResponseDto>>> UpdateAccountAsync(UpdateAccountRequestDto requestDto, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == requestDto.Id);

            if (account == null)
                return Result<IEnumerable<GetAccountItemResponseDto>>.Failure("Account not found.");

            var oldBalance = account.CurrentBalance;

            account.Name = requestDto.Name;
            account.CurrentBalance = requestDto.CurrentBalance;
            account.GoalAmount = requestDto.GoalAmount;
            account.IsDefaultAccount = requestDto.IsDefaultAccount;

            if (requestDto.CurrentBalance != oldBalance)
            {
                var balanceDiff = requestDto.CurrentBalance - oldBalance;
                var transactionType = balanceDiff > 0 ? EnumTransactionType.Income : EnumTransactionType.Expense;

                var systemSubCategory = await _context.SubCategories
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.IsSystem);

                var activeBudget = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.UserId == userId && b.IsActive);

                var transaction = new Transaction
                {
                    UserId = userId,
                    BudgetId = activeBudget?.Id,
                    SubCategoryId = systemSubCategory!.Id,
                    AccountId = account.Id,
                    Value = Math.Abs(balanceDiff),
                    Type = transactionType,
                    Description = "Balance adjustment",
                    TransactionDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    PaymentType = EnumPaymentType.OneTime,
                    IsPaid = false
                };

                _context.Transactions.Add(transaction);
            }

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
