using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class McpPersonalTokenMap : IEntityTypeConfiguration<McpPersonalToken>
    {
        public void Configure(EntityTypeBuilder<McpPersonalToken> builder)
        {
            builder.ToTable("McpPersonalTokens");
            builder.HasKey(t => t.Id);
            builder.Property(t => t.Name).HasMaxLength(80).IsRequired();
            builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
            builder.Property(t => t.Prefix).HasMaxLength(20).IsRequired();
            builder.Property(t => t.Scopes).HasMaxLength(500).IsRequired();
            builder.Property(t => t.ExpiresAt).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(t => t.LastUsedAt).HasColumnType("timestamp with time zone");
            builder.Property(t => t.RevokedAt).HasColumnType("timestamp with time zone");
            builder.Property(t => t.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(t => t.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(t => t.TokenHash).IsUnique().HasDatabaseName("IX_McpPersonalTokens_TokenHash");
        }
    }
}
