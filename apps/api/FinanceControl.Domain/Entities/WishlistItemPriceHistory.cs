namespace FinanceControl.Domain.Entities
{
    public class WishlistItemPriceHistory
    {
        public int Id { get; set; }
        public int WishlistItemId { get; set; }
        public int Price { get; set; }
        public DateTime RecordedAt { get; set; }

        public WishlistItem WishlistItem { get; set; } = null!;
    }
}
