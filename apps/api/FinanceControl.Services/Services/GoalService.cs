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
                Url         = dto.Url,
                ImageUrl    = dto.ImageUrl,
                TargetDate  = dto.TargetDate,
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
                .Select(g => new { GoalId = g.Key, Amount = g.OrderByDescending(c => c.RecordedAt).First().Amount })
                .ToDictionaryAsync(x => x.GoalId, x => x.Amount);

            // For Investment goals, also compute current portfolio value to override the checkpoint
            var investmentPortfolioValue = await GetInvestmentPortfolioValueAsync(context, userId);

            return goals.Select(g =>
            {
                int? currentAmount = g.Type == EnumGoalType.Investment
                    ? (int?)investmentPortfolioValue
                    : latestCheckpoints.TryGetValue(g.Id, out var cp) ? cp : null;
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
                currentAmount = (int?)await GetInvestmentPortfolioValueAsync(context, userId);
            else
                currentAmount = goal.Checkpoints.FirstOrDefault()?.Amount;

            return new GoalDetailResponseDto
            {
                Id                     = goal.Id,
                Name                   = goal.Name,
                Description            = goal.Description,
                Type                   = goal.Type,
                TargetAmount           = goal.TargetAmount,
                Priority               = goal.Priority,
                Status                 = goal.Status,
                Url                    = goal.Url,
                ImageUrl               = goal.ImageUrl,
                TargetDate             = goal.TargetDate,
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
            if (dto.Url is not null)          goal.Url         = dto.Url;
            if (dto.ImageUrl is not null)     goal.ImageUrl    = dto.ImageUrl;
            if (dto.TargetDate.HasValue)      goal.TargetDate  = dto.TargetDate;

            await context.SaveChangesAsync();

            var latestCheckpoint = await context.GoalCheckpoints
                .Where(c => c.GoalId == id)
                .OrderByDescending(c => c.RecordedAt)
                .Select(c => (int?)c.Amount)
                .FirstOrDefaultAsync();

            int? currentAmount = goal.Type == EnumGoalType.Investment
                ? (int?)await GetInvestmentPortfolioValueAsync(context, userId)
                : latestCheckpoint;

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
                ? (int?)await GetInvestmentPortfolioValueAsync(context, userId)
                : await context.GoalCheckpoints
                    .Where(c => c.GoalId == id)
                    .OrderByDescending(c => c.RecordedAt)
                    .Select(c => (int?)c.Amount)
                    .FirstOrDefaultAsync();

            return Result<GoalResponseDto>.Success(MapToResponse(goal, currentAmount));
        }

        private static async Task<long> GetInvestmentPortfolioValueAsync(ApplicationDbContext context, int userId)
        {
            var investments = await context.Investments
                .Where(i => i.UserId == userId && i.CurrentQuantity > 0)
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
                Url                    = goal.Url,
                ImageUrl               = goal.ImageUrl,
                TargetDate             = goal.TargetDate,
                LatestCheckpointAmount = latestCheckpoint,
                CreatedAt              = goal.CreatedAt,
                UpdatedAt              = goal.UpdatedAt,
            };
    }
}
