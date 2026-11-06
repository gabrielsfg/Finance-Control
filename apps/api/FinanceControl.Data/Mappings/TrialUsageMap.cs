using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class TrialUsageMap : IEntityTypeConfiguration<TrialUsage>
    {
        public void Configure(EntityTypeBuilder<TrialUsage> builder)
        {
            builder.ToTable("TrialUsages");
            builder.HasKey(t => t.Id);
            builder.Property(t => t.CpfHash).HasMaxLength(128).IsRequired();
            builder.Property(t => t.UsedAt).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(t => t.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(t => t.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasIndex(t => t.CpfHash).IsUnique();
        }
    }
}
