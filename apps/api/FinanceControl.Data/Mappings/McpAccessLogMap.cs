using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class McpAccessLogMap : IEntityTypeConfiguration<McpAccessLog>
    {
        public void Configure(EntityTypeBuilder<McpAccessLog> builder)
        {
            builder.ToTable("McpAccessLogs");
            builder.HasKey(l => l.Id);
            builder.Property(l => l.ToolName).HasMaxLength(80).IsRequired();
            builder.Property(l => l.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(l => l.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // No navigation to User, but the rows are the user's: deleted with the account.
            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(l => new { l.UserId, l.CreatedAt }).HasDatabaseName("IX_McpAccessLogs_UserId_CreatedAt");
        }
    }
}
