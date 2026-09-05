using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class InvestmentMap : IEntityTypeConfiguration<Investment>
    {
        public void Configure(EntityTypeBuilder<Investment> builder)
        {
            builder.ToTable("Investments");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.MarketAssetId).IsRequired();
            builder.Property(i => i.Broker);
            builder.Property(i => i.CurrentQuantity).IsRequired();
            builder.Property(i => i.AveragePrice).IsRequired();
            builder.Property(i => i.MaturityDate);
            builder.Property(i => i.ExpectedYieldPct);
            builder.Property(i => i.YieldIndex).HasConversion<string>().HasMaxLength(20);
            builder.Property(i => i.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(i => i.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // One position per user per asset.
            builder.HasIndex(i => new { i.UserId, i.MarketAssetId }).IsUnique();

            // Optimistic concurrency via the Postgres system column xmin: concurrent edits
            // to the same position (e.g. two buys at once) are detected instead of silently
            // overwriting each other. A uint shadow property marked IsRowVersion() is
            // auto-mapped by Npgsql to the existing xmin system column — no real column is
            // added, so this requires no migration.
            builder.Property<uint>("Version").IsRowVersion();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(i => i.MarketAsset)
                .WithMany(a => a.Investments)
                .HasForeignKey(i => i.MarketAssetId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Account)
                .WithMany()
                .HasForeignKey(i => i.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
