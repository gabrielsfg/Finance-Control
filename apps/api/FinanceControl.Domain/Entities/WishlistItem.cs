using FinanceControl.Domain.Common;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Entities
{
    public class WishlistItem : OwnedEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TargetPrice { get; set; }
        public EnumWishlistPriority Priority { get; set; } = EnumWishlistPriority.Medium;
        public EnumWishlistStatus Status { get; set; } = EnumWishlistStatus.Pending;
        public string? Url { get; set; }
        public string? ImageUrl { get; set; }

        public ICollection<WishlistItemPriceHistory> PriceHistory { get; set; } = [];
    }
}
