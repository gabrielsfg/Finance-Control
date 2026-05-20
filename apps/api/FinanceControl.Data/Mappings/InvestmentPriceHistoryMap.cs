using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class InvestmentPriceHistoryMap : IEntityTypeConfiguration<InvestmentPriceHistory>
    {
        public void Configure(EntityTypeBuilder<InvestmentPriceHistory> builder)
        {
            builder.ToTable("InvestmentPriceHistories");
            builder.HasKey(h => h.Id);
            builder.Property(h => h.InvestmentId).IsRequired();
            builder.Property(h => h.Date).HasColumnType("date").IsRequired();
            builder.Property(h => h.Price).IsRequired();
            builder.Property(h => h.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(h => h.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasIndex(h => new { h.InvestmentId, h.Date }).IsUnique();

            builder.HasOne(h => h.Investment)
                .WithMany(i => i.PriceHistory)
                .HasForeignKey(h => h.InvestmentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
