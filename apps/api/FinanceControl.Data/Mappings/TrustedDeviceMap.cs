using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class TrustedDeviceMap : IEntityTypeConfiguration<TrustedDevice>
    {
        public void Configure(EntityTypeBuilder<TrustedDevice> builder)
        {
            builder.ToTable("TrustedDevices");
            builder.HasKey(d => d.Id);

            builder.Property(d => d.TokenHash).IsRequired();
            // Login looks the device up by token alone, before the user is known.
            builder.HasIndex(d => d.TokenHash).IsUnique();

            builder.Property(d => d.DeviceName).HasMaxLength(120);
            builder.Property(d => d.IsRevoked).HasDefaultValue(false);

            builder.Property(d => d.ExpiresAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(d => d.LastUsedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(d => d.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();

            builder.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
