using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class BankConnectionMap : IEntityTypeConfiguration<BankConnection>
    {
        public void Configure(EntityTypeBuilder<BankConnection> builder)
        {
            builder.ToTable("BankConnections");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.ItemId).HasMaxLength(100).IsRequired();
            builder.Property(c => c.ConnectorName).HasMaxLength(150).IsRequired();
            builder.Property(c => c.ConnectorImageUrl).HasMaxLength(500);
            builder.Property(c => c.ConnectorPrimaryColor).HasMaxLength(20);
            builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(c => c.ExecutionStatus).HasMaxLength(60);
            builder.Property(c => c.LastErrorCode).HasMaxLength(60);
            builder.Property(c => c.LastErrorMessage).HasMaxLength(500);

            builder.Property(c => c.LastSyncedAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.NextAutoSyncAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.ConsentExpiresAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.LastManualSyncAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.DisconnectedAt).HasColumnType("timestamp with time zone");
            builder.Property(c => c.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(c => c.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Every webhook is resolved to its connection through the item id.
            builder.HasIndex(c => c.ItemId).IsUnique();
            builder.HasIndex(c => new { c.UserId, c.Status });
        }
    }
}
