using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
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
    public class AreaService : IAreaService
    {
        private readonly ApplicationDbContext _context;

        public AreaService(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Result<IEnumerable<GetAllAreaItemResponseDto>>> CreateAreaAsync(CreateAreaRequestDto requestDto, int userId)
        {
            var validate = await ValidateBudgetByIdAsync(requestDto.BudgetId, userId);
            if (!validate)
                return Result<IEnumerable<GetAllAreaItemResponseDto>>.Failure("Mother budget not found");

            var area = new Area()
            {
                UserId = userId,
                BudgetId = requestDto.BudgetId,
                Name = requestDto.Name
            };

            _context.Areas.Add(area);
            await _context.SaveChangesAsync();

            var result = await GetAllAreasAsync(requestDto.BudgetId, userId);
            return Result<IEnumerable<GetAllAreaItemResponseDto>>.Success(result);
        }

        public async Task<IEnumerable<GetAllAreaItemResponseDto>> GetAllAreasAsync(int budgetId, int userId)
        {
            var areas = await _context.Areas.Where(a => a.UserId == userId && a.BudgetId == budgetId).Select(a => new GetAllAreaItemResponseDto
            {
                Id = a.Id,
                Name = a.Name,
            }).ToListAsync();

            return areas;

        }

        public async Task<GetAreaByIdResponseDto?> GetAreaByIdAync(int id, int userId)
        {
            return await _context.Areas.Where(a => a.Id == id && a.UserId == userId).Select(a => new GetAreaByIdResponseDto
            {
                Id = a.Id,
                Name = a.Name,
                BudgetId = a.BudgetId,
            }).FirstOrDefaultAsync();
        }

        public async Task<Result<IEnumerable<GetAllAreaItemResponseDto>>> UpdateAreaAsync(UpdateAreaRequestDto requestDto, int userId)
        {
            var area = await _context.Areas.FirstOrDefaultAsync(a => a.Id == requestDto.Id && a.UserId == userId);

            if (area == null)
                return Result<IEnumerable<GetAllAreaItemResponseDto>>.Failure("Area not found.");

            if (area.BudgetId != requestDto.BudgetId)
            {
                var budgetExists = await ValidateBudgetByIdAsync(requestDto.BudgetId, userId);
                if (!budgetExists)
                    return Result<IEnumerable<GetAllAreaItemResponseDto>>.Failure("Budget not found.");
            }

            area.Name = requestDto.Name;
            area.BudgetId = requestDto.BudgetId;

            await _context.SaveChangesAsync();

            var result = await GetAllAreasAsync(requestDto.BudgetId, userId);
            return Result<IEnumerable<GetAllAreaItemResponseDto>>.Success(result);
        }

        public async Task<Result<IEnumerable<GetAllAreaItemResponseDto>>> DeleteAreaAsync(int id, int userId)
        {
            var area = await _context.Areas.FirstOrDefaultAsync(a => a.UserId == userId && a.Id ==id);

            if (area == null)
                return Result<IEnumerable<GetAllAreaItemResponseDto>>.Failure("Area not found.");

            _context.Areas.Remove(area);
            await _context.SaveChangesAsync();

            var result = await GetAllAreasAsync(area.BudgetId, userId);
            return Result<IEnumerable<GetAllAreaItemResponseDto>>.Success(result);
        }

        private async Task<bool> ValidateBudgetByIdAsync(int budgetId, int userId)
        {
            var result = await _context.Budgets.Where(b => b.Id == budgetId && b.UserId == userId).AnyAsync();

            return result;
        }
    }
}
