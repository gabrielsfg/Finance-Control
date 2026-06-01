using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class InvestmentDividendMap : IEntityTypeConfiguration<InvestmentDividend>
    {
        public void Configure(EntityTypeBuilder<InvestmentDividend> builder)
        {
            builder.ToTable("InvestmentDividends");
            builder.HasKey(d => d.Id);
            builder.Property(d => d.PaymentDate).HasColumnType("date");
            builder.Property(d => d.LastDatePrior).HasColumnType("date");
            builder.Property(d => d.Amount).IsRequired();
            builder.Property(d => d.Type)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(d => d.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(d => d.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(d => d.Investment)
                .WithMany(i => i.Dividends)
                .HasForeignKey(d => d.InvestmentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(d => d.LinkedTransaction)
                .WithMany()
                .HasForeignKey(d => d.LinkedTransactionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(d => new { d.UserId, d.PaymentDate })
                .HasDatabaseName("IX_InvestmentDividends_UserId_PaymentDate");
        }
    }
}
