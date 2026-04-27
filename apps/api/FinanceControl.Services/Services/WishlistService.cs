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
    public class WishlistService : IWishlistService
    {
        private readonly ApplicationDbContext _context;

        public WishlistService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WishlistItemResponseDto> CreateAsync(int userId, CreateWishlistItemRequestDto dto)
        {
            var item = new WishlistItem
            {
                UserId = userId,
                Name = dto.Name,
                Description = dto.Description,
                TargetPrice = dto.TargetPrice,
                Priority = dto.Priority,
                Status = EnumWishlistStatus.Pending,
                Url = dto.Url,
                ImageUrl = dto.ImageUrl
            };

            _context.WishlistItems.Add(item);
            await _context.SaveChangesAsync();

            return MapToResponse(item, latestPrice: null);
        }

        public async Task<IReadOnlyList<WishlistItemResponseDto>> GetAllAsync(int userId, EnumWishlistStatus? status)
        {
            var query = _context.WishlistItems
                .Where(w => w.UserId == userId);

            if (status.HasValue)
                query = query.Where(w => w.Status == status.Value);

            var items = await query
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            var ids = items.Select(i => i.Id).ToList();

            var latestPrices = await _context.WishlistItemPriceHistory
                .Where(p => ids.Contains(p.WishlistItemId))
                .GroupBy(p => p.WishlistItemId)
                .Select(g => new { WishlistItemId = g.Key, Price = g.OrderByDescending(p => p.RecordedAt).First().Price })
                .ToDictionaryAsync(x => x.WishlistItemId, x => x.Price);

            return items
                .Select(i => MapToResponse(i, latestPrices.TryGetValue(i.Id, out var p) ? p : null))
                .ToList();
        }

        public async Task<WishlistItemDetailResponseDto?> GetByIdAsync(int userId, int id)
        {
            var item = await _context.WishlistItems
                .Include(w => w.PriceHistory.OrderByDescending(p => p.RecordedAt))
                .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);

            if (item is null)
                return null;

            var latestPrice = item.PriceHistory.FirstOrDefault()?.Price;

            return new WishlistItemDetailResponseDto
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                TargetPrice = item.TargetPrice,
                Priority = item.Priority,
                Status = item.Status,
                Url = item.Url,
                ImageUrl = item.ImageUrl,
                LatestPrice = latestPrice,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                PriceHistory = item.PriceHistory
                    .Select(p => new WishlistPriceHistoryItemDto
                    {
                        Id = p.Id,
                        Price = p.Price,
                        RecordedAt = p.RecordedAt
                    })
                    .ToList()
            };
        }

        public async Task<Result<WishlistItemResponseDto>> UpdateAsync(int userId, int id, UpdateWishlistItemRequestDto dto)
        {
            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (item is null)
                return Result<WishlistItemResponseDto>.Failure("Wishlist item not found.");

            if (dto.Name is not null) item.Name = dto.Name;
            if (dto.Description is not null) item.Description = dto.Description;
            if (dto.TargetPrice.HasValue) item.TargetPrice = dto.TargetPrice;
            if (dto.Priority.HasValue) item.Priority = dto.Priority.Value;
            if (dto.Status.HasValue) item.Status = dto.Status.Value;
            if (dto.Url is not null) item.Url = dto.Url;
            if (dto.ImageUrl is not null) item.ImageUrl = dto.ImageUrl;

            await _context.SaveChangesAsync();

            var latestPrice = await _context.WishlistItemPriceHistory
                .Where(p => p.WishlistItemId == id)
                .OrderByDescending(p => p.RecordedAt)
                .Select(p => (int?)p.Price)
                .FirstOrDefaultAsync();

            return Result<WishlistItemResponseDto>.Success(MapToResponse(item, latestPrice));
        }

        public async Task<Result<bool>> DeleteAsync(int userId, int id)
        {
            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (item is null)
                return Result<bool>.Failure("Wishlist item not found.");

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();

            return Result<bool>.Success(true);
        }

        public async Task<Result<WishlistPriceHistoryItemDto>> RecordPriceAsync(int userId, int id, int price)
        {
            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (item is null)
                return Result<WishlistPriceHistoryItemDto>.Failure("Wishlist item not found.");

            var entry = new WishlistItemPriceHistory
            {
                WishlistItemId = id,
                Price = price,
                RecordedAt = DateTime.UtcNow
            };

            _context.WishlistItemPriceHistory.Add(entry);
            await _context.SaveChangesAsync();

            return Result<WishlistPriceHistoryItemDto>.Success(new WishlistPriceHistoryItemDto
            {
                Id = entry.Id,
                Price = entry.Price,
                RecordedAt = entry.RecordedAt
            });
        }

        public async Task<Result<WishlistItemResponseDto>> PurchaseAsync(int userId, int id)
        {
            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (item is null)
                return Result<WishlistItemResponseDto>.Failure("Wishlist item not found.");

            if (item.Status != EnumWishlistStatus.Pending)
                return Result<WishlistItemResponseDto>.Failure("conflict");

            item.Status = EnumWishlistStatus.Purchased;
            await _context.SaveChangesAsync();

            var latestPrice = await _context.WishlistItemPriceHistory
                .Where(p => p.WishlistItemId == id)
                .OrderByDescending(p => p.RecordedAt)
                .Select(p => (int?)p.Price)
                .FirstOrDefaultAsync();

            return Result<WishlistItemResponseDto>.Success(MapToResponse(item, latestPrice));
        }

        public async Task<Result<IReadOnlyList<WishlistPriceHistoryItemDto>>> GetPriceHistoryAsync(int userId, int id)
        {
            var exists = await _context.WishlistItems.AnyAsync(w => w.Id == id && w.UserId == userId);
            if (!exists)
                return Result<IReadOnlyList<WishlistPriceHistoryItemDto>>.Failure("Wishlist item not found.");

            var history = await _context.WishlistItemPriceHistory
                .Where(p => p.WishlistItemId == id)
                .OrderBy(p => p.RecordedAt)
                .Select(p => new WishlistPriceHistoryItemDto
                {
                    Id = p.Id,
                    Price = p.Price,
                    RecordedAt = p.RecordedAt
                })
                .ToListAsync();

            return Result<IReadOnlyList<WishlistPriceHistoryItemDto>>.Success(history);
        }

        private static WishlistItemResponseDto MapToResponse(WishlistItem item, int? latestPrice) =>
            new()
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                TargetPrice = item.TargetPrice,
                Priority = item.Priority,
                Status = item.Status,
                Url = item.Url,
                ImageUrl = item.ImageUrl,
                LatestPrice = latestPrice,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };
    }
}
