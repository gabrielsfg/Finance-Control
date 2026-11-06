using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AccessLogMap : IEntityTypeConfiguration<AccessLog>
    {
        public void Configure(EntityTypeBuilder<AccessLog> builder)
        {
            builder.ToTable("AccessLogs");
            builder.HasKey(l => l.Id);
            builder.Property(l => l.UserId).IsRequired();
            builder.Property(l => l.IpAddress).HasMaxLength(45).IsRequired();
            builder.Property(l => l.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(l => l.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            // No foreign key to Users: the record must survive the account (see AccessLog).
            builder.HasIndex(l => new { l.UserId, l.CreatedAt }).HasDatabaseName("IX_AccessLogs_UserId_CreatedAt");
            builder.HasIndex(l => l.CreatedAt);
        }
    }
}
