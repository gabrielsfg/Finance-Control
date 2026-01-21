using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using Microsoft.AspNetCore.Http.HttpResults;
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

        public async Task<Result<GetAllAccountResponseDto>> CreateAccountAsync(CreateAccountRequestDto requestDto, int userId)
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
            return Result<GetAllAccountResponseDto>.Success(accounts);
        }

        public async Task<GetAllAccountResponseDto> GetAllAccountAsync(int userId)
        {
            var accounts = await _context.Accounts
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Name)
                .Select(a => new GetAccountItemResponseDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    CurrentAmout = a.CurrentBalance,
                    IsDefaultAccount = a.IsDefaultAccount
                })
                .ToListAsync();

            return new GetAllAccountResponseDto()
            {
                Accounts = accounts
            };
        }

        public async Task<GetAccountByIdResponseDto> GetAccountByIdAsync(int id, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id);

            if (account == null)
                return null;

            return new GetAccountByIdResponseDto()
            {
                Id = account.Id,
                Name = account.Name,
                CurrentAmount = account.CurrentBalance,
                GoalAmount = account.GoalAmount,
                IsDefaultAccount = account.IsDefaultAccount
            };
        }

        public async Task<Result<GetAllAccountResponseDto>> UpdateAccountAsync(UpdateAccountRequestDto requestDto, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == requestDto.Id);

            if (account == null)
                return Result<GetAllAccountResponseDto>.Failure("Account not found.");

            account.Name = requestDto.Name;
            account.CurrentBalance = requestDto.CurrentBalance;
            account.GoalAmount = requestDto.GoalAmount;
            account.IsDefaultAccount = requestDto.IsDefaultAccount;
            
            await  _context.SaveChangesAsync();
            var accounts = await GetAllAccountAsync(userId);
            return Result<GetAllAccountResponseDto>.Success(accounts);
        }

        public async Task<Result<GetAllAccountResponseDto>> DeleteAccountByIdAsync(int id, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.Id == id);

            if (account == null)
                return Result<GetAllAccountResponseDto>.Failure("Account not found.");

            _context.Remove(account);
            await _context.SaveChangesAsync();

            var accounts = await GetAllAccountAsync(userId);
            return Result<GetAllAccountResponseDto>.Success(accounts);
        }
    }
}
