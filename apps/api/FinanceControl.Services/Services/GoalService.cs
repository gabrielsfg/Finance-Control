using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class GoalService : IGoalService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

        public GoalService(IDbContextFactory<ApplicationDbContext> contextFactory)
        {
            _contextFactory = contextFactory;
        }

        public async Task<GoalResponseDto> CreateAsync(int userId, CreateGoalRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = new Goal
            {
                UserId      = userId,
                Name        = dto.Name,
                Description = dto.Description,
                Type        = dto.Type,
                TargetAmount = dto.TargetAmount,
                Priority    = dto.Priority,
                Status      = EnumGoalStatus.Active,
                Color           = dto.Color,
                Url             = dto.Url,
                ImageUrl        = dto.ImageUrl,
                TargetDate      = dto.TargetDate,
                TargetAssetType = dto.TargetAssetType,
                TargetTicker    = dto.TargetTicker,
            };

            context.Goals.Add(goal);
            await context.SaveChangesAsync();

            return MapToResponse(goal, latestCheckpoint: null);
        }

        public async Task<IReadOnlyList<GoalResponseDto>> GetAllAsync(int userId, EnumGoalType? type, EnumGoalStatus? status)
        {
            await using var context = _contextFactory.CreateDbContext();

            var query = context.Goals.Where(g => g.UserId == userId);

            if (type.HasValue)
                query = query.Where(g => g.Type == type.Value);
            if (status.HasValue)
                query = query.Where(g => g.Status == status.Value);

            var goals = await query.OrderByDescending(g => g.CreatedAt).ToListAsync();

            var ids = goals.Select(g => g.Id).ToList();
            var latestCheckpoints = await context.GoalCheckpoints
                .Where(c => ids.Contains(c.GoalId))
                .GroupBy(c => c.GoalId)
                .Select(g => new { GoalId = g.Key, Amount = g.Sum(c => c.Amount) })
                .ToDictionaryAsync(x => x.GoalId, x => x.Amount);

            // Load all active investments once, then filter per goal
            var allInvestments = await context.Investments
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
                .Select(i => new { i.AssetType, i.Ticker, i.CurrentQuantity, i.CurrentPrice })
                .ToListAsync();

            return goals.Select(g =>
            {
                int? currentAmount;
                if (g.Type == EnumGoalType.Investment)
                {
                    var subset = allInvestments.AsEnumerable();
                    if (g.TargetTicker is not null)
                        subset = subset.Where(i => i.Ticker == g.TargetTicker);
                    else if (g.TargetAssetType.HasValue)
                        subset = subset.Where(i => i.AssetType == g.TargetAssetType.Value);
                    currentAmount = (int)subset.Sum(i => Math.Round(i.CurrentQuantity * i.CurrentPrice));
                }
                else
                {
                    currentAmount = latestCheckpoints.TryGetValue(g.Id, out var cp) ? cp : null;
                }
                return MapToResponse(g, currentAmount);
            }).ToList();
        }

        public async Task<GoalDetailResponseDto?> GetByIdAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals
                .Include(g => g.Checkpoints.OrderByDescending(c => c.RecordedAt))
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

            if (goal is null) return null;

            int? currentAmount;
            if (goal.Type == EnumGoalType.Investment)
                currentAmount = (int?)await GetInvestmentPortfolioValueAsync(context, userId, goal.TargetAssetType, goal.TargetTicker);
            else
                currentAmount = goal.Checkpoints.Any() ? goal.Checkpoints.Sum(c => c.Amount) : null;

            return new GoalDetailResponseDto
            {
                Id                     = goal.Id,
                Name                   = goal.Name,
                Description            = goal.Description,
                Type                   = goal.Type,
                TargetAmount           = goal.TargetAmount,
                Priority               = goal.Priority,
                Status                 = goal.Status,
                Color                  = goal.Color,
                Url                    = goal.Url,
                ImageUrl               = goal.ImageUrl,
                TargetDate             = goal.TargetDate,
                TargetAssetType        = goal.TargetAssetType,
                TargetTicker           = goal.TargetTicker,
                LatestCheckpointAmount = currentAmount,
                CreatedAt              = goal.CreatedAt,
                UpdatedAt              = goal.UpdatedAt,
                Checkpoints            = goal.Checkpoints
                    .Select(c => new GoalCheckpointDto { Id = c.Id, Amount = c.Amount, RecordedAt = c.RecordedAt })
                    .ToList()
            };
        }

        public async Task<Result<GoalResponseDto>> UpdateAsync(int userId, int id, UpdateGoalRequestDto dto)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalResponseDto>.Failure("Goal not found.");

            if (dto.Name is not null)         goal.Name        = dto.Name;
            if (dto.Description is not null)  goal.Description = dto.Description;
            if (dto.TargetAmount.HasValue)    goal.TargetAmount = dto.TargetAmount.Value;
            if (dto.Priority.HasValue)        goal.Priority    = dto.Priority.Value;
            if (dto.Status.HasValue)          goal.Status      = dto.Status.Value;
            if (dto.Color is not null)              goal.Color           = dto.Color;
            if (dto.Url is not null)                goal.Url             = dto.Url;
            if (dto.ImageUrl is not null)           goal.ImageUrl        = dto.ImageUrl;
            if (dto.TargetDate.HasValue)            goal.TargetDate      = dto.TargetDate;
            if (dto.TargetAssetType.HasValue)       goal.TargetAssetType = dto.TargetAssetType;
            if (dto.TargetTicker is not null)       goal.TargetTicker    = dto.TargetTicker;

            await context.SaveChangesAsync();

            var checkpointSum = await context.GoalCheckpoints
                .Where(c => c.GoalId == id)
                .SumAsync(c => (int?)c.Amount);

            int? currentAmount = goal.Type == EnumGoalType.Investment
                ? (int?)await GetInvestmentPortfolioValueAsync(context, userId, goal.TargetAssetType, goal.TargetTicker)
                : checkpointSum;

            return Result<GoalResponseDto>.Success(MapToResponse(goal, currentAmount));
        }

        public async Task<Result<bool>> DeleteAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<bool>.Failure("Goal not found.");

            context.Goals.Remove(goal);
            await context.SaveChangesAsync();

            return Result<bool>.Success(true);
        }

        public async Task<Result<GoalCheckpointDto>> RecordCheckpointAsync(int userId, int id, int amount)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalCheckpointDto>.Failure("Goal not found.");

            var checkpoint = new GoalCheckpoint
            {
                GoalId     = id,
                Amount     = amount,
                RecordedAt = DateTime.UtcNow,
            };

            context.GoalCheckpoints.Add(checkpoint);
            await context.SaveChangesAsync();

            return Result<GoalCheckpointDto>.Success(new GoalCheckpointDto
            {
                Id         = checkpoint.Id,
                Amount     = checkpoint.Amount,
                RecordedAt = checkpoint.RecordedAt,
            });
        }

        public async Task<Result<GoalResponseDto>> AchieveAsync(int userId, int id)
        {
            await using var context = _contextFactory.CreateDbContext();

            var goal = await context.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            if (goal is null) return Result<GoalResponseDto>.Failure("Goal not found.");

            if (goal.Status != EnumGoalStatus.Active)
                return Result<GoalResponseDto>.Failure("conflict");

            goal.Status = EnumGoalStatus.Achieved;
            await context.SaveChangesAsync();

            int? currentAmount = goal.Type == EnumGoalType.Investment
                ? (int?)await GetInvestmentPortfolioValueAsync(context, userId, goal.TargetAssetType, goal.TargetTicker)
                : await context.GoalCheckpoints
                    .Where(c => c.GoalId == id)
                    .SumAsync(c => (int?)c.Amount);

            return Result<GoalResponseDto>.Success(MapToResponse(goal, currentAmount));
        }

        private static async Task<long> GetInvestmentPortfolioValueAsync(
            ApplicationDbContext context,
            int userId,
            EnumAssetType? assetType,
            string? ticker)
        {
            var query = context.Investments
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0);

            if (ticker is not null)
                query = query.Where(i => i.Ticker == ticker);
            else if (assetType.HasValue)
                query = query.Where(i => i.AssetType == assetType.Value);

            var investments = await query
                .Select(i => new { i.CurrentQuantity, i.CurrentPrice })
                .ToListAsync();

            return (long)investments.Sum(i => Math.Round(i.CurrentQuantity * i.CurrentPrice));
        }

        private static GoalResponseDto MapToResponse(Goal goal, int? latestCheckpoint) =>
            new()
            {
                Id                     = goal.Id,
                Name                   = goal.Name,
                Description            = goal.Description,
                Type                   = goal.Type,
                TargetAmount           = goal.TargetAmount,
                Priority               = goal.Priority,
                Status                 = goal.Status,
                Color                  = goal.Color,
                Url                    = goal.Url,
                ImageUrl               = goal.ImageUrl,
                TargetDate             = goal.TargetDate,
                TargetAssetType        = goal.TargetAssetType,
                TargetTicker           = goal.TargetTicker,
                LatestCheckpointAmount = latestCheckpoint,
                CreatedAt              = goal.CreatedAt,
                UpdatedAt              = goal.UpdatedAt,
            };
    }
}
