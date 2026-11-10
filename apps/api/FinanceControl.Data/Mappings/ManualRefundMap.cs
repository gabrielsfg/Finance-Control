using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class ManualRefundMap : IEntityTypeConfiguration<ManualRefund>
    {
        public void Configure(EntityTypeBuilder<ManualRefund> builder)
        {
            builder.ToTable("ManualRefunds");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.UserId).IsRequired();
            builder.Property(r => r.UserName).HasMaxLength(200).IsRequired();
            builder.Property(r => r.UserEmail).HasMaxLength(320).IsRequired();
            builder.Property(r => r.AsaasCustomerId).HasMaxLength(64);
            builder.Property(r => r.AsaasPaymentId).HasMaxLength(64);
            builder.Property(r => r.BillingMethod).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(r => r.Amount).IsRequired();
            builder.Property(r => r.Reason).HasMaxLength(500).IsRequired();
            builder.Property(r => r.NotifiedAt).HasColumnType("timestamp with time zone");
            builder.Property(r => r.ResolvedAt).HasColumnType("timestamp with time zone");
            builder.Property(r => r.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(r => r.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // No foreign keys: the refund is owed after the account and its charges are gone.
            // The hourly job looks for notices the inbox has not accepted yet.
            builder.HasIndex(r => r.NotifiedAt);
        }
    }
}
