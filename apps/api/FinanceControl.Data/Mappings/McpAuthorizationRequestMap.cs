using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class McpAuthorizationRequestMap : IEntityTypeConfiguration<McpAuthorizationRequest>
    {
        public void Configure(EntityTypeBuilder<McpAuthorizationRequest> builder)
        {
            builder.ToTable("McpAuthorizationRequests");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.PublicId).HasMaxLength(64).IsRequired();
            builder.Property(r => r.ClientId).HasMaxLength(500).IsRequired();
            builder.Property(r => r.RedirectUri).HasMaxLength(1000).IsRequired();
            builder.Property(r => r.CodeChallenge).HasMaxLength(128).IsRequired();
            builder.Property(r => r.Scopes).HasMaxLength(500).IsRequired();
            builder.Property(r => r.State).HasMaxLength(1000);
            builder.Property(r => r.Resource).HasMaxLength(500);
            builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(r => r.ExpiresAt).HasColumnType("timestamp with time zone").IsRequired();
            builder.Property(r => r.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(r => r.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasIndex(r => r.PublicId).IsUnique().HasDatabaseName("IX_McpAuthorizationRequests_PublicId");
        }
    }
}
