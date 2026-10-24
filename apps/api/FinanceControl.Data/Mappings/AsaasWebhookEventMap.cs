using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AsaasWebhookEventMap : IEntityTypeConfiguration<AsaasWebhookEvent>
    {
        public void Configure(EntityTypeBuilder<AsaasWebhookEvent> builder)
        {
            builder.ToTable("AsaasWebhookEvents");
            builder.HasKey(e => e.Id);

            builder.Property(e => e.EventId).HasMaxLength(150).IsRequired();
            builder.Property(e => e.EventType).HasMaxLength(80).IsRequired();
            builder.Property(e => e.Payload).HasColumnType("jsonb").IsRequired();
            builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(e => e.Attempts).HasDefaultValue(0).IsRequired();
            builder.Property(e => e.LastError).HasMaxLength(1000);

            builder.Property(e => e.NextAttemptAt).HasColumnType("timestamp with time zone");
            builder.Property(e => e.ProcessedAt).HasColumnType("timestamp with time zone");
            builder.Property(e => e.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(e => e.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // Asaas delivers at least once: the unique id turns a redelivery into a no-op.
            builder.HasIndex(e => e.EventId).IsUnique();

            // The worker polls pending events in arrival order.
            builder.HasIndex(e => new { e.Status, e.CreatedAt });
        }
    }
}
