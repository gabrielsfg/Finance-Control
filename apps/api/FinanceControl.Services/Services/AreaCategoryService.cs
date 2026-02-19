using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Services
{
    public class AreaCategoryService : IAreaCategoryService
    {
        private readonly ApplicationDbContext _context;

        public AreaCategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetAllCategoryByAreaResponseDto>>> AddCategoryToAreaAsync(int areaId, int categoryId, int userId)
        {
            var validateArea = await ValidateAreaByUserIdAsync(areaId, userId);
            if (!validateArea)
                return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Failure("Area not found.");

            var validateCategory = await ValidateCategoryByUserIdAsync(categoryId, userId);
            if (!validateCategory)
                return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Failure("Category not found.");

            var areaCategory = new AreaCategory()
            {
                CategoryId = categoryId,
                AreaId = areaId
            };

            _context.Add(areaCategory);
            await _context.SaveChangesAsync();

            var result = await GetCategoriesByAreaAsync(areaId, userId);
            return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Success(result.Value);
        }

        public async Task<Result<IEnumerable<GetAllCategoryByAreaResponseDto>>> GetCategoriesByAreaAsync(int areaId, int userId)
        {
            var validateArea = await ValidateAreaByUserIdAsync(areaId, userId);
            if (!validateArea)
                return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Failure("Area not found.");

            var result = await _context.AreaCategories
                .Where(ac => ac.AreaId == areaId)
                .Select(ac => new GetAllCategoryByAreaResponseDto
                {
                    Id = ac.Category.Id,
                    Name = ac.Category.Name
                }).ToListAsync();

            return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Success(result);

        }

        public async Task<Result<IEnumerable<GetAllCategoryByAreaResponseDto>>> RemoveCategoryFromAreaAsync(int areaId, int categoryId, int userId)
        {
            var validateArea = await ValidateAreaByUserIdAsync(areaId, userId);
            if (!validateArea)
                return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Failure("Area not found.");

            var validateCategory = await ValidateCategoryByUserIdAsync(categoryId, userId);
            if (!validateCategory)
                return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Failure("Category not found.");

            var categoryFromArea = await _context.AreaCategories.FirstOrDefaultAsync(ac => ac.AreaId == areaId && ac.CategoryId == categoryId);
            if (categoryFromArea == null)
                return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Failure("Category is not associated with this area.");

            _context.AreaCategories.Remove(categoryFromArea);
            await _context.SaveChangesAsync();

            var result = await GetCategoriesByAreaAsync(areaId, userId);
            return Result<IEnumerable<GetAllCategoryByAreaResponseDto>>.Success(result.Value);
        }

        private async Task<bool> ValidateAreaByUserIdAsync(int areaId, int userId)
        {
            var result = await _context.Areas.Where(a => a.Id == areaId && a.UserId == userId).AnyAsync();
            return result;
        }

        private async Task<bool> ValidateCategoryByUserIdAsync(int categoryId, int userId)
        {
            var result = await _context.Categories.Where(c => c.Id == categoryId && c.UserId == userId).AnyAsync();
            return result;
        }

    }
}
