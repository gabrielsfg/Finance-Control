using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class RefreshTokenMap : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.ToTable("RefreshTokens");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Token).IsRequired();
            // Refresh and logout look the token up by value on every call; the token is a
            // 64-byte random string so a unique index is both correct and the hot path.
            builder.HasIndex(r => r.Token).IsUnique();
            builder.Property(r => r.ExpiresAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(r => r.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(r => r.IsRevoked).HasDefaultValue(false);
            builder.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
