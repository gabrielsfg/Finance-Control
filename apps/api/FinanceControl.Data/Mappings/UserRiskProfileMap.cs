using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class UserRiskProfileMap : IEntityTypeConfiguration<UserRiskProfile>
    {
        public void Configure(EntityTypeBuilder<UserRiskProfile> builder)
        {
            builder.ToTable("UserRiskProfiles");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.InvestmentHorizon).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(p => p.LossTolerance).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(p => p.ReserveMonthsTarget).IsRequired();
            builder.Property(p => p.ExperienceLevel).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(p => p.Classification).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(p => p.AnsweredAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();
            builder.Property(p => p.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(p => p.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(p => p.User)
                .WithOne()
                .HasForeignKey<UserRiskProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // One profile per user — the questionnaire is answered again over the same row.
            builder.HasIndex(p => p.UserId).IsUnique();
        }
    }
}
