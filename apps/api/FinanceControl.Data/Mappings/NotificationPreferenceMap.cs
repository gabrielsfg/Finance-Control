using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class NotificationPreferenceMap : IEntityTypeConfiguration<NotificationPreference>
    {
        public void Configure(EntityTypeBuilder<NotificationPreference> builder)
        {
            builder.ToTable("NotificationPreferences");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.RecurrenceChargedEnabled).IsRequired();
            builder.Property(p => p.CardDueEnabled).IsRequired();
            builder.Property(p => p.CardDueDaysAhead).IsRequired();
            builder.Property(p => p.CardClosingEnabled).IsRequired();
            builder.Property(p => p.CardClosingDaysAhead).IsRequired();
            builder.Property(p => p.BudgetAlertEnabled).IsRequired();
            builder.Property(p => p.BudgetWarningPercent).IsRequired();

            builder.Property(p => p.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(p => p.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // One preferences row per user.
            builder.HasIndex(p => p.UserId)
                .HasDatabaseName("IX_NotificationPreferences_UserId")
                .IsUnique();
        }
    }
}
