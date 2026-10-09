using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AiMessageMap : IEntityTypeConfiguration<AiMessage>
    {
        public void Configure(EntityTypeBuilder<AiMessage> builder)
        {
            builder.ToTable("AiMessages");
            builder.HasKey(m => m.Id);
            builder.Property(m => m.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(m => m.Content).IsRequired();
            builder.Property(m => m.ToolCalls).HasColumnType("jsonb");
            builder.Property(m => m.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(m => m.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(m => new { m.ConversationId, m.CreatedAt })
                .HasDatabaseName("IX_AiMessages_ConversationId_CreatedAt");
        }
    }
}
