using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class BudgetService : IBudgetService
    {
        private readonly ApplicationDbContext _context;

        public BudgetService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<GetBudgetWithAreasResponseDto>> CreateBudgetAsync(CreateBudgetRequestDto requestDto, int userId)
        {
            var budget = new Budget
            {
                Name = requestDto.Name,
                StartDate = requestDto.StartDate,
                Recurrence = requestDto.Recurrence,
                UserId = userId,
                IsActive = requestDto.IsActive
            };

            var hasAnyBudget = await _context.Budgets.AnyAsync(b => b.UserId == userId);
            if (!hasAnyBudget)
            {
                budget.IsActive = true;
            }
            else if (budget.IsActive)
            {
                var currentActive = await _context.Budgets.FirstOrDefaultAsync(b => b.UserId == userId && b.IsActive);
                if (currentActive != null)
                    currentActive.IsActive = false;
            }

            await _context.Budgets.AddAsync(budget);
            await _context.SaveChangesAsync();

            var areas = requestDto.Areas.Select(a => new Area
            {
                Name = a.Name,
                BudgetId = budget.Id,
                UserId = userId
            }).ToList();

            await _context.Areas.AddRangeAsync(areas);
            await _context.SaveChangesAsync();

            var allocations = new List<BudgetSubcategoryAllocation>();
            for (int i = 0; i < requestDto.Areas.Count; i++)
            {
                var areaDto = requestDto.Areas[i];
                var area = areas[i];
                foreach (var allocationDto in areaDto.Allocations)
                {
                    allocations.Add(new BudgetSubcategoryAllocation
                    {
                        BudgetId = budget.Id,
                        AreaId = area.Id,
                        SubCategoryId = allocationDto.SubCategoryId,
                        ExpectedValue = allocationDto.ExpectedValue,
                        AllocationType = allocationDto.AllocationType
                    });
                }
            }

            await _context.BudgetSubcategoryAllocations.AddRangeAsync(allocations);
            await _context.SaveChangesAsync();

            return Result<GetBudgetWithAreasResponseDto>.Success(await BuildBudgetWithAreasResponse(budget.Id, userId));
        }

        public async Task<IEnumerable<GetAllBudgetResponseDto>> GetAllBudgetAsync(int userId)
        {
            var budgets = await _context.Budgets.Where(b => b.UserId == userId).Select(b => new GetAllBudgetResponseDto
            {
                Id = b.Id,
                Name = b.Name,
                Recurrence = b.Recurrence
            }).ToListAsync();

            return budgets;
        }

        public async Task<GetBudgetByIdResponseDto> GetBudgetByIdAsync(int id, int userId)
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id);

            if (budget == null)
                return null;

            var startDate = new DateOnly(DateTime.Now.Year, DateTime.Now.Month, budget.StartDate);

            var finishDate = budget.Recurrence switch
            {
                EnumBudgetRecurrence.Weekly => startDate.AddDays(7),
                EnumBudgetRecurrence.Biweekly => startDate.AddDays(14),
                EnumBudgetRecurrence.Monthly => startDate.AddMonths(1),
                EnumBudgetRecurrence.Semiannually => startDate.AddMonths(6),
                EnumBudgetRecurrence.Annually => startDate.AddYears(1),
                _ => startDate
            };

            return new GetBudgetByIdResponseDto
            {
                Id = budget.Id,
                Name = budget.Name,
                StartDate = startDate,
                FinishDate = finishDate,
                Recurrence = budget.Recurrence
            };
        }

        public async Task<GetBudgetWithAreasResponseDto> GetBudgetWithAllocationsAsync(int id, int userId)
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (budget == null)
                return null;

            var startDate = new DateOnly(DateTime.Now.Year, DateTime.Now.Month, budget.StartDate);

            var finishDate = budget.Recurrence switch
            {
                EnumBudgetRecurrence.Weekly => startDate.AddDays(7),
                EnumBudgetRecurrence.Biweekly => startDate.AddDays(14),
                EnumBudgetRecurrence.Monthly => startDate.AddMonths(1),
                EnumBudgetRecurrence.Semiannually => startDate.AddMonths(6),
                EnumBudgetRecurrence.Annually => startDate.AddYears(1),
                _ => startDate
            };

            var areas = await _context.Areas
                .Where(a => a.BudgetId == id && a.UserId == userId)
                .Include(a => a.BudgetSubcategoryAllocations)
                    .ThenInclude(al => al.SubCategory)
                .ToListAsync();

            var spentBySubCategory = await _context.Transactions
                .Where(t => t.BudgetId == id && t.UserId == userId
                    && t.TransactionDate >= startDate && t.TransactionDate < finishDate)
                .GroupBy(t => new { t.SubCategoryId, t.Type })
                .Select(g => new { g.Key.SubCategoryId, g.Key.Type, Total = g.Sum(t => t.Value) })
                .ToListAsync();

            return new GetBudgetWithAreasResponseDto
            {
                Id = budget.Id,
                Name = budget.Name,
                StartDate = startDate,
                FinishDate = finishDate,
                Recurrence = budget.Recurrence,
                IsActive = budget.IsActive,
                Areas = areas.Select(a => new AreaInBudgetResponseDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Allocations = a.BudgetSubcategoryAllocations.Select(al =>
                    {
                        var matchingType = al.AllocationType == EnumAllocationType.Income
                            ? EnumTransactionType.Income
                            : EnumTransactionType.Expense;

                        var spent = spentBySubCategory
                            .Where(s => s.SubCategoryId == al.SubCategoryId && s.Type == matchingType)
                            .Sum(s => s.Total);

                        return new AllocationInBudgetResponseDto
                        {
                            Id = al.Id,
                            SubCategoryId = al.SubCategoryId,
                            SubCategoryName = al.SubCategory.Name,
                            ExpectedValue = al.ExpectedValue,
                            SpentValue = spent,
                            AllocationType = al.AllocationType
                        };
                    }).ToList()
                }).ToList()
            };
        }

        public async Task<Result<GetBudgetWithAreasResponseDto>> UpdateBudgetAsync(UpdateBudgetRequestDto requestDto, int userId)
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == requestDto.Id);

            if (budget == null)
                return Result<GetBudgetWithAreasResponseDto>.Failure("Budget not found.");

            var existingAreas = await _context.Areas
                .Where(a => a.BudgetId == budget.Id && a.UserId == userId)
                .Include(a => a.BudgetSubcategoryAllocations)
                .ToListAsync();

            // Update budget fields
            budget.Name = requestDto.Name;
            budget.StartDate = requestDto.StartDate;
            budget.Recurrence = requestDto.Recurrence;
            budget.IsActive = requestDto.IsActive;

            if (requestDto.IsActive)
            {
                var currentActive = await _context.Budgets
                    .FirstOrDefaultAsync(b => b.UserId == userId && b.IsActive && b.Id != requestDto.Id);
                if (currentActive != null)
                    currentActive.IsActive = false;
            }

            // Delete areas not present in request (DB cascade removes their allocations)
            var requestedAreaIds = requestDto.Areas
                .Where(a => a.Id.HasValue)
                .Select(a => a.Id!.Value)
                .ToHashSet();

            var areasToDelete = existingAreas.Where(a => !requestedAreaIds.Contains(a.Id)).ToList();
            if (areasToDelete.Any())
                _context.RemoveRange(areasToDelete);

            // Update existing areas
            foreach (var areaDto in requestDto.Areas.Where(a => a.Id.HasValue))
            {
                var existingArea = existingAreas.FirstOrDefault(a => a.Id == areaDto.Id);
                if (existingArea == null)
                    return Result<GetBudgetWithAreasResponseDto>.Failure($"Area {areaDto.Id} not found in this budget.");
                existingArea.Name = areaDto.Name;
            }

            // Create new areas and save to get their Ids
            var newAreaMap = new Dictionary<UpsertAreaInBudgetDto, Area>();
            foreach (var areaDto in requestDto.Areas.Where(a => !a.Id.HasValue))
            {
                var newArea = new Area { Name = areaDto.Name, BudgetId = budget.Id, UserId = userId };
                await _context.Areas.AddAsync(newArea);
                newAreaMap[areaDto] = newArea;
            }

            if (newAreaMap.Any())
                await _context.SaveChangesAsync();

            // Process allocations per area
            var now = DateTime.UtcNow;
            foreach (var areaDto in requestDto.Areas)
            {
                Area area;
                ICollection<BudgetSubcategoryAllocation> existingAllocations;

                if (areaDto.Id.HasValue)
                {
                    area = existingAreas.First(a => a.Id == areaDto.Id);
                    existingAllocations = area.BudgetSubcategoryAllocations;
                }
                else
                {
                    area = newAreaMap[areaDto];
                    existingAllocations = [];
                }

                // Delete allocations not present in request for this area
                var requestedAllocationIds = areaDto.Allocations
                    .Where(al => al.Id.HasValue)
                    .Select(al => al.Id!.Value)
                    .ToHashSet();

                var allocationsToDelete = existingAllocations
                    .Where(al => !requestedAllocationIds.Contains(al.Id))
                    .ToList();

                if (allocationsToDelete.Any())
                {
                    _context.RemoveRange(allocationsToDelete);
                    area.UpdatedAt = now;
                }

                // Upsert allocations
                foreach (var allocationDto in areaDto.Allocations)
                {
                    if (allocationDto.Id.HasValue)
                    {
                        var existing = existingAllocations.FirstOrDefault(al => al.Id == allocationDto.Id);
                        if (existing == null)
                            return Result<GetBudgetWithAreasResponseDto>.Failure($"Allocation {allocationDto.Id} not found.");
                        existing.SubCategoryId = allocationDto.SubCategoryId;
                        existing.ExpectedValue = allocationDto.ExpectedValue;
                        existing.AllocationType = allocationDto.AllocationType;
                        area.UpdatedAt = now;
                    }
                    else
                    {
                        await _context.BudgetSubcategoryAllocations.AddAsync(new BudgetSubcategoryAllocation
                        {
                            BudgetId = budget.Id,
                            AreaId = area.Id,
                            SubCategoryId = allocationDto.SubCategoryId,
                            ExpectedValue = allocationDto.ExpectedValue,
                            AllocationType = allocationDto.AllocationType
                        });
                        area.UpdatedAt = now;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Result<GetBudgetWithAreasResponseDto>.Success(await BuildBudgetWithAreasResponse(budget.Id, userId));
        }

        public async Task<Result<IEnumerable<GetAllBudgetResponseDto>>> DeleteBudgetAsync(int id, int userId)
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id);

            if (budget == null)
                return Result<IEnumerable<GetAllBudgetResponseDto>>.Failure("Budget not found.");

            _context.Remove(budget);
            await _context.SaveChangesAsync();

            var budgets = await GetAllBudgetAsync(userId);

            return Result<IEnumerable<GetAllBudgetResponseDto>>.Success(budgets);
        }

        private async Task<GetBudgetWithAreasResponseDto> BuildBudgetWithAreasResponse(int budgetId, int userId)
        {
            var budget = await _context.Budgets.FirstAsync(b => b.Id == budgetId && b.UserId == userId);

            var areas = await _context.Areas
                .Where(a => a.BudgetId == budgetId && a.UserId == userId)
                .Include(a => a.BudgetSubcategoryAllocations)
                    .ThenInclude(al => al.SubCategory)
                .ToListAsync();

            var startDate = new DateOnly(DateTime.Now.Year, DateTime.Now.Month, budget.StartDate);

            var finishDate = budget.Recurrence switch
            {
                EnumBudgetRecurrence.Weekly => startDate.AddDays(7),
                EnumBudgetRecurrence.Biweekly => startDate.AddDays(14),
                EnumBudgetRecurrence.Monthly => startDate.AddMonths(1),
                EnumBudgetRecurrence.Semiannually => startDate.AddMonths(6),
                EnumBudgetRecurrence.Annually => startDate.AddYears(1),
                _ => startDate
            };

            return new GetBudgetWithAreasResponseDto
            {
                Id = budget.Id,
                Name = budget.Name,
                StartDate = startDate,
                FinishDate = finishDate,
                Recurrence = budget.Recurrence,
                IsActive = budget.IsActive,
                Areas = areas.Select(a => new AreaInBudgetResponseDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Allocations = a.BudgetSubcategoryAllocations.Select(al => new AllocationInBudgetResponseDto
                    {
                        Id = al.Id,
                        SubCategoryId = al.SubCategoryId,
                        SubCategoryName = al.SubCategory.Name,
                        ExpectedValue = al.ExpectedValue,
                        AllocationType = al.AllocationType
                    }).ToList()
                }).ToList()
            };
        }
    }
}
