using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AiConversationMap : IEntityTypeConfiguration<AiConversation>
    {
        public void Configure(EntityTypeBuilder<AiConversation> builder)
        {
            builder.ToTable("AiConversations");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Title).HasMaxLength(120).IsRequired();
            builder.Property(c => c.LastMessageAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(c => c.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(c => c.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // The conversation list, newest first.
            builder.HasIndex(c => new { c.UserId, c.LastMessageAt })
                .HasDatabaseName("IX_AiConversations_UserId_LastMessageAt");
        }
    }
}
