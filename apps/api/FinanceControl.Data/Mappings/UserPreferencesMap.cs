using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class UserPreferencesMap : IEntityTypeConfiguration<UserPreferences>
    {
        public void Configure(EntityTypeBuilder<UserPreferences> builder)
        {
            builder.ToTable("UserPreferences");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.CurrencyCode)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("BRL");
            builder.Property(p => p.Locale)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("pt-BR");
            builder.Property(p => p.AnalyticsConfig)
                .IsRequired()
                .HasColumnType("text")
                .HasDefaultValue("[]");
            builder.HasOne(p => p.User)
                .WithOne()
                .HasForeignKey<UserPreferences>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(p => p.UserId).IsUnique();
        }
    }
}
