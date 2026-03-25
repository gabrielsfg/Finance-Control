using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
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
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;
        public CategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<CategoryResponseDto>>> CreateCategoryAsync(CreateCategoryRequestDto requestDto, int userId)
        {
            Category category = new Category
            {
                Name = requestDto.Name,
                UserId = userId,
            };

            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();

            var result = await GetAllCategoriesAsync(userId);
            return Result<IEnumerable<CategoryResponseDto>>.Success(result);
        }
        public async Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesAsync(int userId)
        {
            var categories = await _context.Categories
                .Where(c => c.UserId == userId && !c.IsSystem)
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SubCategories = c.SubCategories
                        .Where(s => s.UserId == userId && !s.IsSystem)
                        .Select(s => new GetSubCategoryResponseDto
                        {
                            Id = s.Id,
                            Name = s.Name,
                            CategoryId = s.CategoryId
                        })
                        .ToList()
                })
                .ToListAsync();

            return categories;
        }

        public async Task<Result<IEnumerable<CategoryResponseDto>>> UpdateCategoriesAsync(UpdateCategoriesRequestDto requestDto, int userId)
        {
            var ids = requestDto.Categories.Select(c => c.Id).ToList();

            var categoriesToUpdate = await _context.Categories
                .Where(c => c.UserId == userId && ids.Contains(c.Id))
                .ToListAsync();

            foreach (var item in requestDto.Categories)
            {
                var category = categoriesToUpdate.FirstOrDefault(c => c.Id == item.Id);

                if (category == null)
                    return Result<IEnumerable<CategoryResponseDto>>.Failure($"Category with id {item.Id} not found.");

                if (category.IsSystem)
                    return Result<IEnumerable<CategoryResponseDto>>.Failure($"Category with id {item.Id} is a system category and cannot be modified.");

                category.Name = item.Name;
            }

            await _context.SaveChangesAsync();

            var categories = await GetAllCategoriesAsync(userId);
            return Result<IEnumerable<CategoryResponseDto>>.Success(categories);
        }

        public async Task<Result<IEnumerable<CategoryResponseDto>>> DeleteCategoryByIdAsync(int id, int userId)
        {
            var categoryToDelete = await _context.Categories
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Id == id);

            if (categoryToDelete == null)
                return Result<IEnumerable<CategoryResponseDto>>.Failure("Category not found.");

            if (categoryToDelete.IsSystem)
                return Result<IEnumerable<CategoryResponseDto>>.Failure("System categories cannot be deleted.");

            _context.Remove(categoryToDelete);
            await _context.SaveChangesAsync();

            var categories = await GetAllCategoriesAsync(userId);
            return Result<IEnumerable<CategoryResponseDto>>.Success(categories);
        }
    }
}
