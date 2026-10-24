using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class SubscriptionMap : IEntityTypeConfiguration<Subscription>
    {
        public void Configure(EntityTypeBuilder<Subscription> builder)
        {
            builder.ToTable("Subscriptions");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Plan).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(s => s.Cycle).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(s => s.BillingMethod).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(s => s.EndReason).HasConversion<string>().HasMaxLength(20);
            builder.Property(s => s.PendingPlan).HasConversion<string>().HasMaxLength(20);
            builder.Property(s => s.PendingCycle).HasConversion<string>().HasMaxLength(20);
            builder.Property(s => s.InstallmentCount).HasDefaultValue(1).IsRequired();
            builder.Property(s => s.Price).IsRequired();
            builder.Property(s => s.IsComplimentary).HasDefaultValue(false).IsRequired();

            builder.Property(s => s.TrialEndsAt).HasColumnType("timestamp with time zone");
            builder.Property(s => s.CurrentPeriodStart).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(s => s.CurrentPeriodEnd).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(s => s.CanceledAt).HasColumnType("timestamp with time zone");
            builder.Property(s => s.EndedAt).HasColumnType("timestamp with time zone");
            builder.Property(s => s.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(s => s.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // At most one live subscription per user. The service checks first; this is
            // the guarantee when two signups race.
            builder.HasIndex(s => s.UserId)
                .IsUnique()
                .HasFilter("\"Status\" <> 'Expired'")
                .HasDatabaseName("IX_Subscriptions_UserId_Live");

            // The billing job scans live subscriptions by period end.
            builder.HasIndex(s => new { s.Status, s.CurrentPeriodEnd });
        }
    }
}
