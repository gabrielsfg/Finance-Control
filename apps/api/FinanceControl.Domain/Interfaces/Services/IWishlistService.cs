using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IWishlistService
    {
        Task<WishlistItemResponseDto> CreateAsync(int userId, CreateWishlistItemRequestDto dto);
        Task<IReadOnlyList<WishlistItemResponseDto>> GetAllAsync(int userId, EnumWishlistStatus? status);
        Task<WishlistItemDetailResponseDto?> GetByIdAsync(int userId, int id);
        Task<Result<WishlistItemResponseDto>> UpdateAsync(int userId, int id, UpdateWishlistItemRequestDto dto);
        Task<Result<bool>> DeleteAsync(int userId, int id);
        Task<Result<WishlistPriceHistoryItemDto>> RecordPriceAsync(int userId, int id, int price);
        Task<Result<WishlistItemResponseDto>> PurchaseAsync(int userId, int id);
        Task<Result<IReadOnlyList<WishlistPriceHistoryItemDto>>> GetPriceHistoryAsync(int userId, int id);
    }
}
