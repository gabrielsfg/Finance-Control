using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class BillingRecordMap : IEntityTypeConfiguration<BillingRecord>
    {
        public void Configure(EntityTypeBuilder<BillingRecord> builder)
        {
            builder.ToTable("BillingRecords");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.AsaasCustomerId).HasMaxLength(64);
            builder.Property(r => r.CpfHash).HasMaxLength(128);
            builder.Property(r => r.Plan).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(r => r.Cycle).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(r => r.BillingMethod).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(r => r.InstallmentCount).HasDefaultValue(1).IsRequired();
            builder.Property(r => r.Amount).IsRequired();
            builder.Property(r => r.AsaasPaymentId).HasMaxLength(64);
            builder.Property(r => r.AsaasInstallmentId).HasMaxLength(64);
            builder.Property(r => r.AsaasInvoiceId).HasMaxLength(64);
            builder.Property(r => r.InvoicePdfUrl).HasMaxLength(500);

            builder.Property(r => r.PeriodStart).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(r => r.PeriodEnd).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(r => r.DueDate).HasColumnType("date").IsRequired();
            builder.Property(r => r.ConfirmedAt).HasColumnType("timestamp with time zone");
            builder.Property(r => r.RefundedAt).HasColumnType("timestamp with time zone");
            builder.Property(r => r.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(r => r.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // No foreign key to Users: the record outlives the account (see BillingRecord).
            builder.HasIndex(r => r.FormerUserId);
            builder.HasIndex(r => r.CreatedAt);
        }
    }
}
