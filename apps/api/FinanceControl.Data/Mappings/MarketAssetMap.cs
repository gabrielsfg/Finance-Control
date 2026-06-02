using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class MarketAssetMap : IEntityTypeConfiguration<MarketAsset>
    {
        public void Configure(EntityTypeBuilder<MarketAsset> builder)
        {
            builder.ToTable("MarketAssets");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Ticker).IsRequired();
            builder.Property(a => a.Name).IsRequired();
            builder.Property(a => a.AssetType)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(a => a.CurrentPrice).IsRequired();
            builder.Property(a => a.LastPriceUpdate)
                .HasColumnType("timestamp with time zone");
            builder.Property(a => a.LogoUrl).HasColumnType("text");
            builder.Property(a => a.Currency)
                .IsRequired()
                .HasDefaultValue("BRL");
            builder.Property(a => a.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(a => a.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // One global row per ticker — the dedup guarantee.
            builder.HasIndex(a => a.Ticker).IsUnique();
        }
    }
}
