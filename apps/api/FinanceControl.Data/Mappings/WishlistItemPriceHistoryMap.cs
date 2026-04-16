using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class WishlistItemPriceHistoryMap : IEntityTypeConfiguration<WishlistItemPriceHistory>
    {
        public void Configure(EntityTypeBuilder<WishlistItemPriceHistory> builder)
        {
            builder.ToTable("WishlistItemPriceHistory");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Price).IsRequired();
            builder.Property(p => p.RecordedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            builder.HasOne(p => p.WishlistItem)
                .WithMany(w => w.PriceHistory)
                .HasForeignKey(p => p.WishlistItemId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
