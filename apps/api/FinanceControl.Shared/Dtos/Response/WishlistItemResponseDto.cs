using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class WishlistItemResponseDto
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string? Description { get; init; }
        public int? TargetPrice { get; init; }
        public EnumWishlistPriority Priority { get; init; }
        public EnumWishlistStatus Status { get; init; }
        public string? Url { get; init; }
        public string? ImageUrl { get; init; }
        public int? LatestPrice { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
    }
}
