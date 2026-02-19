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
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponseDto 
                { 
                    Id = c.Id, 
                    Name = c.Name
                })
                .ToListAsync();

            return categories;
        }

        public async Task<Result<IEnumerable<CategoryResponseDto>>> UpdateCategoryByIdAsync(UpdateCategoryRequestDto requestDto, int userId)
        {
            var categoryToPatch = await _context.Categories
                .FirstOrDefaultAsync(c => c.UserId == userId && c.Id == requestDto.Id);

            if (categoryToPatch == null)
                return Result<IEnumerable<CategoryResponseDto>>.Failure("Category not found.");

            categoryToPatch.Name = requestDto.Name;
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

            _context.Remove(categoryToDelete);
            await _context.SaveChangesAsync();

            var categories = await GetAllCategoriesAsync(userId);
            return Result<IEnumerable<CategoryResponseDto>>.Success(categories);
        }
    }
}
