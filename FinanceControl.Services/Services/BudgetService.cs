using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Enums;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Services
{
    public class BudgetService : IBudgetService
    {
        private readonly ApplicationDbContext _context;

        public BudgetService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<int>> CreateBudgetAsync(CreateBudgetResquestDto requestDto, int userId)
        {
            Budget budget = new Budget
            {
                Name = requestDto.Name,
                StartDate = requestDto.StartDate,
                Reccurrence = Enum.Parse<EnumBudgetRecurrence>(requestDto.Reccurrence, ignoreCase: true),
                UserId = userId,
            };

            await _context.Budgets.AddAsync(budget);
            await _context.SaveChangesAsync();

            return Result<int>.Success(budget.Id);
        }

        public async Task<List<GetAllBudgetResponseDto>> GetAllBudgetAsync(int userId)
        {
            var budgets = await _context.Budgets.Where(b => b.UserId == userId).Select(b => new GetAllBudgetResponseDto
            {
                Id = b.Id,
                Name = b.Name,
                Reccurrence = b.Reccurrence.ToString()
            }).ToListAsync();

            return budgets;
        }

        public async Task<GetBudgetByIdResponseDto> GetBudgetByIdAsync(int id, int userId)
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id);

            if (budget == null)
                return null;

            var startDate = new DateOnly(DateTime.Now.Year, DateTime.Now.Month, budget.StartDate);

            var finishDate = budget.Reccurrence switch
            {
                EnumBudgetRecurrence.Weekly => startDate.AddDays(7),
                EnumBudgetRecurrence.Biweekley => startDate.AddDays(14),
                EnumBudgetRecurrence.Monthly => startDate.AddMonths(1),
                EnumBudgetRecurrence.Semiannually => startDate.AddMonths(6),
                EnumBudgetRecurrence.Annualy => startDate.AddYears(1),
                _ => startDate
            };

            return new GetBudgetByIdResponseDto
            {
                Id = budget.Id,
                Name = budget.Name,
                StartDate = startDate,
                FinishDate = finishDate,
                Reccurence = budget.Reccurrence.ToString()
            };
        }

        public async Task<Result<GetBudgetByIdResponseDto>> UpdateBudgetAsync(UpdateBudgetRequestDto requestDto, int userId)
        {
            var budget = _context.Budgets.FirstOrDefault(b => b.UserId == userId && b.Id == requestDto.Id);

            if (budget == null)
                return Result<GetBudgetByIdResponseDto>.Failure("Budget not found.");

            budget.Name = requestDto.Name;
            budget.StartDate = requestDto.StartDate;
            budget.Reccurrence = Enum.Parse<EnumBudgetRecurrence>(requestDto.Reccurrence, ignoreCase: true);

            await _context.SaveChangesAsync();
            var budgetResult = await GetBudgetByIdAsync(requestDto.Id, userId);
            return Result<GetBudgetByIdResponseDto>.Success(budgetResult);
        }

        public async Task<Result<List<GetAllBudgetResponseDto>>> DeleteBudgetAsync(int id, int userId)
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id);

            if(budget == null)
                return Result<List<GetAllBudgetResponseDto>>.Failure("Budget not found.");

            _context.Remove(budget);
            await _context.SaveChangesAsync();

            var budgets = await GetAllBudgetAsync(userId);

            return Result<List<GetAllBudgetResponseDto>>.Success(budgets);
        }
    }
}
