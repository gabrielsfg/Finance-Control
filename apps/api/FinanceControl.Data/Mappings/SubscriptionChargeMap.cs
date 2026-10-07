using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class SubscriptionChargeMap : IEntityTypeConfiguration<SubscriptionCharge>
    {
        public void Configure(EntityTypeBuilder<SubscriptionCharge> builder)
        {
            builder.ToTable("SubscriptionCharges");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.IdempotencyKey).HasMaxLength(100).IsRequired();
            builder.Property(c => c.Plan).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(c => c.Cycle).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(c => c.BillingMethod).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(c => c.InstallmentCount).HasDefaultValue(1).IsRequired();
            builder.Property(c => c.Amount).IsRequired();

            builder.Property(c => c.AsaasPaymentId).HasMaxLength(64);
            builder.Property(c => c.AsaasInstallmentId).HasMaxLength(64);
            builder.Property(c => c.InvoiceUrl).HasMaxLength(500);
            builder.Property(c => c.BankSlipUrl).HasMaxLength(500);
            builder.Property(c => c.PixPayload).HasMaxLength(1000);
            builder.Property(c => c.FailureReason).HasMaxLength(300);

            builder.Property(c => c.PeriodStart).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(c => c.PeriodEnd).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(c => c.DueDate).HasColumnType("date").IsRequired();
            builder.Property(c => c.PixExpiresAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.ConfirmedAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.RefundedAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(c => c.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(c => c.Subscription)
                .WithMany(s => s.Charges)
                .HasForeignKey(c => c.SubscriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique and sent to Asaas as externalReference: the anchor that makes a retry
            // find the charge it already made.
            builder.HasIndex(c => c.IdempotencyKey).IsUnique();

            // Webhooks find the charge by the Asaas ids.
            builder.HasIndex(c => c.AsaasPaymentId);
            builder.HasIndex(c => c.AsaasInstallmentId);
            builder.HasIndex(c => c.UserId);
        }
    }
}
