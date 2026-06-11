using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class AlertRuleService : IAlertRuleService
    {
        private readonly ApplicationDbContext _context;

        public AlertRuleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GetAlertRuleResponseDto>> GetAllAsync(int userId)
        {
            return await _context.AlertRules
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.IsActive)
                .ThenByDescending(r => r.CreatedAt)
                .Select(ToDto)
                .ToListAsync();
        }

        public async Task<Result<IEnumerable<GetAlertRuleResponseDto>>> CreateAsync(
            CreateAlertRuleRequestDto requestDto, int userId)
        {
            var assetExists = await _context.MarketAssets
                .AnyAsync(a => a.Id == requestDto.MarketAssetId);
            if (!assetExists)
                return Result<IEnumerable<GetAlertRuleResponseDto>>.Failure("Asset not found.");

            // Avoid stacking identical active alerts on the same asset.
            var duplicate = await _context.AlertRules.AnyAsync(r =>
                r.UserId == userId &&
                r.MarketAssetId == requestDto.MarketAssetId &&
                r.Direction == requestDto.Direction &&
                r.TargetValue == requestDto.TargetValue &&
                r.IsActive && !r.IsTriggered);
            if (duplicate)
                return Result<IEnumerable<GetAlertRuleResponseDto>>.Failure("An identical active alert already exists.");

            _context.AlertRules.Add(new AlertRule
            {
                UserId = userId,
                MarketAssetId = requestDto.MarketAssetId,
                Direction = requestDto.Direction,
                TargetValue = requestDto.TargetValue,
                IsActive = true,
                IsTriggered = false,
            });
            await _context.SaveChangesAsync();

            return Result<IEnumerable<GetAlertRuleResponseDto>>.Success(await GetAllAsync(userId));
        }

        public async Task<IEnumerable<GetAlertRuleResponseDto>> DeleteAsync(int id, int userId)
        {
            var rule = await _context.AlertRules
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (rule is not null)
            {
                _context.AlertRules.Remove(rule);
                await _context.SaveChangesAsync();
            }

            return await GetAllAsync(userId);
        }

        private static readonly System.Linq.Expressions.Expression<Func<AlertRule, GetAlertRuleResponseDto>> ToDto =
            r => new GetAlertRuleResponseDto
            {
                Id = r.Id,
                MarketAssetId = r.MarketAssetId,
                Ticker = r.MarketAsset.Ticker,
                AssetName = r.MarketAsset.Name,
                Direction = r.Direction,
                TargetValue = r.TargetValue,
                IsActive = r.IsActive,
                IsTriggered = r.IsTriggered,
                CreatedAt = r.CreatedAt,
                TriggeredAt = r.TriggeredAt,
            };
    }
}
