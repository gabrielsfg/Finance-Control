using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;


namespace FinanceControl.Services.Services
{
    public class BudgetSubCategoryAllocationService : IBudgetSubCategoryAllocationService
    {
        private readonly ApplicationDbContext _context;

        public BudgetSubCategoryAllocationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>> AddSubCategoryToBudgetAsync(AddSubCategoryToBudgetRequestDto requestDto, int userId)
        {
            var validateBudget = await ValidateBudgetByUserIdAsync(requestDto.BudgetId, userId);
            if (!validateBudget)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var validateArea = await ValidateAreaByUserIdAsync(requestDto.AreaId, userId);
            if (!validateArea)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var validateSubCategory = await ValidateSubCategoryByUserIdAsync(requestDto.SubCategoryId, userId);
            if (!validateSubCategory)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var validateAreaByBudget = await ValidateAreaByBudgetIdAsync(requestDto.AreaId, requestDto.BudgetId);
            if (!validateAreaByBudget)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");


            var isDuplicate = await _context.BudgetSubcategoryAllocations
                .AnyAsync(bsa => bsa.AreaId == requestDto.AreaId
                && bsa.SubCategoryId == requestDto.SubCategoryId);

            if (isDuplicate)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var allocation = new BudgetSubcategoryAllocation
            {
                BudgetId = requestDto.BudgetId,
                AreaId = requestDto.AreaId,
                SubCategoryId = requestDto.SubCategoryId,
                ExpectedValue = requestDto.ExpectedValue
            };

            _context.Add(allocation);
            await _context.SaveChangesAsync();

            var area = new List<int>
            {
                requestDto.AreaId,
            };

            return await GetAllSubCategoryAllocationByAreasAsync(area, userId);
        }

        public async Task<Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>> GetAllSubCategoryAllocationByAreasAsync(List<int> areasId, int userId)
        {
            var areas = await _context.Areas
                .Where(a => areasId.Contains(a.Id) && a.UserId == userId)
                .Select(a => new { a.Id, a.Name })
                .ToListAsync();

            if (areas == null)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var allocations = await _context.BudgetSubcategoryAllocations
                .Where(bsa => areasId.Contains(bsa.AreaId))
                .Select(bsa => new
                {
                    bsa.AreaId,
                    bsa.SubCategoryId,
                    SubcategoryName = bsa.SubCategory.Name,
                    bsa.ExpectedValue,
                    bsa.SubCategory.CategoryId,
                    CategoryName = bsa.SubCategory.Category.Name
                }).ToListAsync();

            var result = areas.Select(area =>
            {
                var areaAllocations = allocations.Where(a => a.AreaId == area.Id);

                var categories = areaAllocations
                    .GroupBy(a => new { a.CategoryId, a.CategoryName })
                    .Select(g => new CategoryAllocationItemByAreaIdDto
                    {
                        CategoryId = g.Key.CategoryId,
                        CategoryName = g.Key.CategoryName,
                        CategoryExpectedValue = g.Sum(a => a.ExpectedValue),
                        SubCategories = g.Select(a => new SubCategoryAllocationItemByCategoryIdDto
                        {
                            SubCategoryId = a.SubCategoryId,
                            SubCategoryName = a.SubcategoryName,
                            SubCategoryExpectedValue = a.ExpectedValue
                        }).ToList()
                    }).ToList();

                return new GetAllSubCategoryAllocationByAreaResponseDto
                {
                    AreaId = area.Id,
                    AreaName = area.Name,
                    Categories = categories
                };
            });

            return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Success(result);
        }

        public async Task<Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>> GetAllSubCategoryAllocationByBudgetAsync(int budgetId, int userId)
        {
            var validateBudget = await ValidateBudgetByUserIdAsync(budgetId, userId);
            if (!validateBudget)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var areas = await _context.Areas.Where(a => a.BudgetId == budgetId).Select(a => a.Id).ToListAsync();
            if (!areas.Any())
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            return await GetAllSubCategoryAllocationByAreasAsync(areas, userId);
        }

        public async Task<Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>> RemoveSubCategoryFromBudgetAsync(int allocationId, int budgetId, int userId)
        {
            var allocation = await _context.BudgetSubcategoryAllocations
                .FirstOrDefaultAsync(bsa => bsa.Id == allocationId
                && bsa.BudgetId == budgetId
                && bsa.SubCategory.UserId == userId);

            if (allocation == null)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            var areaResult = new List<int>
            {
                allocation.AreaId
            };

            _context.BudgetSubcategoryAllocations.Remove(allocation);
            await _context.SaveChangesAsync();

            return await GetAllSubCategoryAllocationByAreasAsync(areaResult, userId);
        }

        public async Task<Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>> UpdateBudgetSubCategoryAllocationAsync(UpdateSubCategoryToBudgetRequestDto requestDto, int Id, int budgetId, int userId)
        {
            var allocation = await _context.BudgetSubcategoryAllocations
                .FirstOrDefaultAsync(bsa => bsa.Id == Id
                && bsa.BudgetId == budgetId
                && bsa.SubCategory.UserId == userId);

            if (allocation == null)
                return Result<IEnumerable<GetAllSubCategoryAllocationByAreaResponseDto>>.Failure("Invalid parameters.");

            allocation.ExpectedValue = requestDto.ExpectedValue;

            await _context.SaveChangesAsync();

            var area = new List<int>
            {
                allocation.AreaId
            };

            return await GetAllSubCategoryAllocationByAreasAsync(area, userId);

        }

        private async Task<bool> ValidateBudgetByUserIdAsync(int budgetId, int userId)
        {
            var result = await _context.Budgets.Where(b => b.Id == budgetId && b.UserId == userId).AnyAsync();
            return result;
        }

        private async Task<bool> ValidateAreaByUserIdAsync(int areaId, int userId)
        {
            var result = await _context.Areas.Where(a => a.Id == areaId && a.UserId == userId).AnyAsync();
            return result;
        }

        private async Task<bool> ValidateSubCategoryByUserIdAsync(int subCategoryId, int userId)
        {
            var result = await _context.SubCategories.Where(sc => sc.Id == subCategoryId && sc.UserId == userId).AnyAsync();
            return result;
        }

        private async Task<bool> ValidateAreaByBudgetIdAsync(int areaId, int budgetId)
        {
            var result = await _context.Areas.Where(a => a.Id == areaId && a.BudgetId == budgetId).AnyAsync();
            return result;
        }
    }
}
