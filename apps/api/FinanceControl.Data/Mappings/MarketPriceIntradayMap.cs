using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class MarketPriceIntradayMap : IEntityTypeConfiguration<MarketPriceIntraday>
    {
        public void Configure(EntityTypeBuilder<MarketPriceIntraday> builder)
        {
            builder.ToTable("MarketPriceIntradays");
            builder.HasKey(h => h.Id);
            builder.Property(h => h.MarketAssetId).IsRequired();
            builder.Property(h => h.Timestamp)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(h => h.Price).IsRequired();
            builder.Property(h => h.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(h => h.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // One tick per asset per 15-min slot.
            builder.HasIndex(h => new { h.MarketAssetId, h.Timestamp }).IsUnique();
            // Fast range queries for cleanup and chart data.
            builder.HasIndex(h => h.Timestamp);

            builder.HasOne(h => h.MarketAsset)
                .WithMany(a => a.PriceIntraday)
                .HasForeignKey(h => h.MarketAssetId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
