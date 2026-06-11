using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class NotificationMap : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("Notifications");
            builder.HasKey(n => n.Id);

            builder.Property(n => n.Type)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(40);

            builder.Property(n => n.Title).IsRequired().HasMaxLength(150);
            builder.Property(n => n.Body).IsRequired().HasMaxLength(500);
            builder.Property(n => n.ActionUrl).HasMaxLength(300);
            builder.Property(n => n.DedupeKey).HasMaxLength(200);
            builder.Property(n => n.IsRead).IsRequired();

            builder.Property(n => n.ReadAt)
                .HasColumnType("timestamp with time zone");

            builder.Property(n => n.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(n => n.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Bell query: list a user's notifications, newest first.
            builder.HasIndex(n => new { n.UserId, n.CreatedAt })
                .HasDatabaseName("IX_Notifications_UserId_CreatedAt");

            // Dedupe lookup before insert (UserId + DedupeKey).
            builder.HasIndex(n => new { n.UserId, n.DedupeKey })
                .HasDatabaseName("IX_Notifications_UserId_DedupeKey");
        }
    }
}
