using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class MarketAssetFundamentalsMap : IEntityTypeConfiguration<MarketAssetFundamentals>
    {
        public void Configure(EntityTypeBuilder<MarketAssetFundamentals> builder)
        {
            builder.ToTable("MarketAssetFundamentals");
            builder.HasKey(f => f.Id);
            builder.Property(f => f.MarketAssetId).IsRequired();
            builder.Property(f => f.FetchedAt).HasColumnType("timestamp with time zone");
            builder.Property(f => f.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(f => f.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // One fundamentals row per asset.
            builder.HasIndex(f => f.MarketAssetId).IsUnique();

            builder.HasOne(f => f.MarketAsset)
                .WithOne(a => a.Fundamentals)
                .HasForeignKey<MarketAssetFundamentals>(f => f.MarketAssetId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
