using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Services.Services
{
    public class SubCategoryService : ISubCategoryService
    {
        private readonly ApplicationDbContext _context;
        public SubCategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetSubCategoryResponseDto>>> CreateSubCategoryAsync(CreateSubCategoryRequestDto requestDto, int userId)
        {
            var categoryValidator = await ValidateCategoryByIdAsync(requestDto.CategoryId, userId);

            if (!categoryValidator)
                return Result<IEnumerable<GetSubCategoryResponseDto>>.Failure("Mother Category not found.");

            var subCategory = new SubCategory()
            {
                Name = requestDto.Name,
                Emoji = requestDto.Emoji,
                CategoryId = requestDto.CategoryId,
                UserId = userId
            };

            await _context.AddAsync(subCategory);
            await _context.SaveChangesAsync();

            var result = await GetAllSubCategoryAsync(userId);
            return Result<IEnumerable<GetSubCategoryResponseDto>>.Success(result);
        }

        public async Task<IEnumerable<GetSubCategoryResponseDto>> GetAllSubCategoryAsync(int userId)
        {
            var subCategories = await _context.SubCategories
                .Where(s => s.UserId == userId && !s.IsSystem)
                .Select(s => new GetSubCategoryResponseDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Emoji = s.Emoji,
                    CategoryId = s.CategoryId,
                    CategoryName = s.Category.Name,
                    CategoryColor = s.Category.Color,
                    IsSavings = s.IsSavings
                }).ToListAsync();

            return subCategories;
        }

        public async Task<GetSubCategoryResponseDto?> GetSubCategoryByIdAsync(int id, int userId)
        {
            return await _context.SubCategories
                .Where(s => s.UserId == userId && s.Id == id && !s.IsSystem)
                .Select(s => new GetSubCategoryResponseDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Emoji = s.Emoji,
                    CategoryId = s.CategoryId,
                    CategoryName = s.Category.Name,
                    CategoryColor = s.Category.Color,
                    IsSavings = s.IsSavings
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Result<IEnumerable<GetSubCategoryResponseDto>>> UpdateSubCategoryAsync(UpdateSubCategoryRequestDto requestDto, int userId)
        {
            var categoryValidator = await ValidateCategoryByIdAsync(requestDto.CategoryId, userId);

            if (!categoryValidator)
                return Result<IEnumerable<GetSubCategoryResponseDto>>.Failure("Mother Category not found.");


            var subCategory = await _context.SubCategories.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == requestDto.Id);

            if (subCategory == null)
                return Result<IEnumerable<GetSubCategoryResponseDto>>.Failure("SubCategory not found.");

            if (subCategory.IsSystem)
                return Result<IEnumerable<GetSubCategoryResponseDto>>.Failure("System subcategories cannot be modified.");

            subCategory.Name = requestDto.Name;
            subCategory.Emoji = requestDto.Emoji;
            subCategory.CategoryId = requestDto.CategoryId;
            subCategory.IsSavings = requestDto.IsSavings;

            await _context.SaveChangesAsync();
            var result = await GetAllSubCategoryAsync(userId);

            return Result<IEnumerable<GetSubCategoryResponseDto>>.Success(result);
        }

        /// <summary>
        /// Replaces the set of subcategories that count as savings. Sent whole rather than
        /// one flag at a time because the screen that owns it is a checklist: what the user
        /// left unticked is as much a decision as what they ticked.
        /// </summary>
        public async Task<IEnumerable<GetSubCategoryResponseDto>> SetSavingsSubCategoriesAsync(
            IEnumerable<int> subCategoryIds,
            int userId)
        {
            var wanted = subCategoryIds?.ToHashSet() ?? [];

            var subCategories = await _context.SubCategories
                .Where(s => s.UserId == userId && !s.IsSystem)
                .ToListAsync();

            foreach (var subCategory in subCategories)
                subCategory.IsSavings = wanted.Contains(subCategory.Id);

            await _context.SaveChangesAsync();

            return await GetAllSubCategoryAsync(userId);
        }

        public async Task<Result<IEnumerable<GetSubCategoryResponseDto>>> DeleteSubCategoryAsync(int id, int userId)
        {
            var subCategory = await _context.SubCategories.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == id);

            if (subCategory == null)
                return Result<IEnumerable<GetSubCategoryResponseDto>>.Failure("SubCategory not found.");

            if (subCategory.IsSystem)
                return Result<IEnumerable<GetSubCategoryResponseDto>>.Failure("System subcategories cannot be deleted.");

            _context.Remove(subCategory);
            await _context.SaveChangesAsync();

            var result = await GetAllSubCategoryAsync(userId);

            return Result<IEnumerable<GetSubCategoryResponseDto>>.Success(result);
        }

        private async Task<Boolean> ValidateCategoryByIdAsync(int categoryId, int userId)
        {
            var category = await _context.Categories.Where(x => x.UserId == userId && x.Id == categoryId && !x.IsSystem).AnyAsync();
            return category;
        }
    }
}
