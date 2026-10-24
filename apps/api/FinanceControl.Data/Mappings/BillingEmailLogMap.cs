using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class BillingEmailLogMap : IEntityTypeConfiguration<BillingEmailLog>
    {
        public void Configure(EntityTypeBuilder<BillingEmailLog> builder)
        {
            builder.ToTable("BillingEmailLogs");
            builder.HasKey(l => l.Id);

            builder.Property(l => l.Key).HasMaxLength(150).IsRequired();
            builder.Property(l => l.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(l => l.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(l => l.Key).IsUnique();
        }
    }
}
