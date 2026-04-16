using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateWishlistItemRequestDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int? TargetPrice { get; set; }
        public EnumWishlistPriority? Priority { get; set; }
        public EnumWishlistStatus? Status { get; set; }
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }
    }
}
