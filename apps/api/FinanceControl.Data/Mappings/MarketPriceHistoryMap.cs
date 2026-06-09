using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class MarketPriceHistoryMap : IEntityTypeConfiguration<MarketPriceHistory>
    {
        public void Configure(EntityTypeBuilder<MarketPriceHistory> builder)
        {
            builder.ToTable("MarketPriceHistories");
            builder.HasKey(h => h.Id);
            builder.Property(h => h.MarketAssetId).IsRequired();
            builder.Property(h => h.Date).HasColumnType("date").IsRequired();
            builder.Property(h => h.Price).IsRequired();
            builder.Property(h => h.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(h => h.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // Idempotency: one price row per asset per day.
            builder.HasIndex(h => new { h.MarketAssetId, h.Date }).IsUnique();

            builder.HasOne(h => h.MarketAsset)
                .WithMany(a => a.PriceHistory)
                .HasForeignKey(h => h.MarketAssetId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
