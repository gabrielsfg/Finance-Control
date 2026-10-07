using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class McpClientMap : IEntityTypeConfiguration<McpClient>
    {
        public void Configure(EntityTypeBuilder<McpClient> builder)
        {
            builder.ToTable("McpClients");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.ClientId).HasMaxLength(500).IsRequired();
            builder.Property(c => c.ClientName).HasMaxLength(120).IsRequired();
            builder.Property(c => c.ClientUri).HasMaxLength(500);
            builder.Property(c => c.RedirectUris).HasColumnType("jsonb").IsRequired();
            builder.Property(c => c.Source).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(c => c.MetadataFetchedAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(c => c.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasIndex(c => c.ClientId).IsUnique().HasDatabaseName("IX_McpClients_ClientId");
        }
    }
}
