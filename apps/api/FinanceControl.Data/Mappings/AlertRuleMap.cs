using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AlertRuleMap : IEntityTypeConfiguration<AlertRule>
    {
        public void Configure(EntityTypeBuilder<AlertRule> builder)
        {
            builder.ToTable("AlertRules");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.Direction)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(10);

            builder.Property(r => r.TargetValue).IsRequired();
            builder.Property(r => r.IsActive).IsRequired();
            builder.Property(r => r.IsTriggered).IsRequired();
            builder.Property(r => r.TriggeredAt)
                .HasColumnType("timestamp with time zone");

            builder.Property(r => r.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(r => r.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(r => r.MarketAsset)
                .WithMany()
                .HasForeignKey(r => r.MarketAssetId)
                .OnDelete(DeleteBehavior.Cascade);

            // The price-evaluation pass scans active, not-yet-triggered rules.
            builder.HasIndex(r => new { r.IsActive, r.IsTriggered })
                .HasDatabaseName("IX_AlertRules_IsActive_IsTriggered");

            builder.HasIndex(r => r.UserId)
                .HasDatabaseName("IX_AlertRules_UserId");
        }
    }
}
