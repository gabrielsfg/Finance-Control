using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateWishlistItemRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TargetPrice { get; set; }
        public EnumWishlistPriority Priority { get; set; } = EnumWishlistPriority.Medium;
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }
    }
}
