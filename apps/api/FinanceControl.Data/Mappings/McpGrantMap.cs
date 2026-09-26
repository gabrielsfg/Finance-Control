using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class McpGrantMap : IEntityTypeConfiguration<McpGrant>
    {
        public void Configure(EntityTypeBuilder<McpGrant> builder)
        {
            builder.ToTable("McpGrants");
            builder.HasKey(g => g.Id);
            builder.Property(g => g.ClientId).HasMaxLength(500).IsRequired();
            builder.Property(g => g.ClientName).HasMaxLength(120).IsRequired();
            builder.Property(g => g.RedirectUri).HasMaxLength(1000).IsRequired();
            builder.Property(g => g.Scopes).HasMaxLength(500).IsRequired();
            builder.Property(g => g.CodeHash).HasMaxLength(64);
            builder.Property(g => g.CodeChallenge).HasMaxLength(128);
            builder.Property(g => g.AccessTokenHash).HasMaxLength(64);
            builder.Property(g => g.RefreshTokenHash).HasMaxLength(64);
            builder.Property(g => g.CodeExpiresAt).HasColumnType("timestamp with time zone");
            builder.Property(g => g.AccessTokenExpiresAt).HasColumnType("timestamp with time zone");
            builder.Property(g => g.RefreshTokenExpiresAt).HasColumnType("timestamp with time zone");
            builder.Property(g => g.LastUsedAt).HasColumnType("timestamp with time zone");
            builder.Property(g => g.RevokedAt).HasColumnType("timestamp with time zone");
            builder.Property(g => g.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(g => g.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(g => g.User)
                .WithMany()
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Every MCP request resolves its grant by token hash, so these are the hot lookups.
            builder.HasIndex(g => g.AccessTokenHash).HasDatabaseName("IX_McpGrants_AccessTokenHash");
            builder.HasIndex(g => g.RefreshTokenHash).HasDatabaseName("IX_McpGrants_RefreshTokenHash");
            builder.HasIndex(g => g.CodeHash).HasDatabaseName("IX_McpGrants_CodeHash");
            builder.HasIndex(g => g.UserId).HasDatabaseName("IX_McpGrants_UserId");
        }
    }
}
