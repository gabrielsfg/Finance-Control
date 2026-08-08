using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class SecurityCodeMap : IEntityTypeConfiguration<SecurityCode>
    {
        public void Configure(EntityTypeBuilder<SecurityCode> builder)
        {
            builder.ToTable("SecurityCodes");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Purpose)
                .HasConversion<string>()
                .IsRequired();

            builder.Property(c => c.CodeHash).IsRequired();
            builder.Property(c => c.Attempts).HasDefaultValue(0).IsRequired();

            builder.Property(c => c.ExpiresAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(c => c.ConsumedAt)
                .HasColumnType("timestamp with time zone");
            builder.Property(c => c.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();

            // Every read is "the live code for this user and this purpose" — validating,
            // resending and superseding all take that path.
            builder.HasIndex(c => new { c.UserId, c.Purpose });

            // The two-factor step arrives holding only the challenge token, so that lookup
            // needs its own index. Partial, because only two-factor rows have the column set.
            builder.HasIndex(c => c.ChallengeTokenHash)
                .HasFilter("\"ChallengeTokenHash\" IS NOT NULL");

            builder.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
