using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AiPendingActionMap : IEntityTypeConfiguration<AiPendingAction>
    {
        public void Configure(EntityTypeBuilder<AiPendingAction> builder)
        {
            builder.ToTable("AiPendingActions");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Kind).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(a => a.Payload).HasColumnType("jsonb").IsRequired();
            builder.Property(a => a.Error).HasMaxLength(500);
            builder.Property(a => a.ExpiresAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(a => a.ResolvedAt)
                .HasColumnType("timestamp with time zone");
            builder.Property(a => a.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(a => a.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(a => a.Conversation)
                .WithMany(c => c.Actions)
                .HasForeignKey(a => a.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(a => new { a.ConversationId, a.MessageId })
                .HasDatabaseName("IX_AiPendingActions_ConversationId_MessageId");
        }
    }
}
