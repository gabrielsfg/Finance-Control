using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class UserInsightMap : IEntityTypeConfiguration<UserInsight>
    {
        public void Configure(EntityTypeBuilder<UserInsight> builder)
        {
            builder.ToTable("UserInsights");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Kind).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(i => i.PeriodStart).IsRequired();
            builder.Property(i => i.Content).HasColumnType("jsonb").IsRequired();
            builder.Property(i => i.Snapshot).HasColumnType("jsonb").IsRequired();
            builder.Property(i => i.Model).HasMaxLength(60).IsRequired();
            builder.Property(i => i.GeneratedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(i => i.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(i => i.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(i => i.User)
                .WithMany()
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // The cache key. Unique so a race between two tabs cannot bill the same
            // analysis twice — the loser hits the constraint and re-reads the winner's row.
            builder.HasIndex(i => new { i.UserId, i.Kind, i.PeriodStart })
                .IsUnique()
                .HasDatabaseName("IX_UserInsights_UserId_Kind_PeriodStart");
        }
    }
}
