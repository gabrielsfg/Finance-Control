using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class BillingProfileMap : IEntityTypeConfiguration<BillingProfile>
    {
        public void Configure(EntityTypeBuilder<BillingProfile> builder)
        {
            builder.ToTable("BillingProfiles");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.AsaasCustomerId).HasMaxLength(64);
            builder.Property(p => p.CpfHash).HasMaxLength(128);
            builder.Property(p => p.CardTokenCipher).HasMaxLength(512);
            builder.Property(p => p.CardBrand).HasMaxLength(30);
            builder.Property(p => p.CardLast4).HasMaxLength(4);
            builder.Property(p => p.CardFailureCount).HasDefaultValue(0).IsRequired();

            builder.Property(p => p.TrialConsumedAt).HasColumnType("timestamp with time zone");
            builder.Property(p => p.CardFailureWindowStart).HasColumnType("timestamp with time zone");
            builder.Property(p => p.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(p => p.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(p => p.UserId).IsUnique();

            // The trial rule looks profiles up by CPF. Not unique: two accounts may share a
            // CPF (a couple paying with one card) — they just share one trial.
            builder.HasIndex(p => p.CpfHash);
        }
    }
}
