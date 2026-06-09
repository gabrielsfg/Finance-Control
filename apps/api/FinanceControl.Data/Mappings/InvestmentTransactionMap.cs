using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class InvestmentTransactionMap : IEntityTypeConfiguration<InvestmentTransaction>
    {
        public void Configure(EntityTypeBuilder<InvestmentTransaction> builder)
        {
            builder.ToTable("InvestmentTransactions");

            builder.HasIndex(t => new { t.UserId, t.Date, t.Operation })
                .HasDatabaseName("IX_InvestmentTransactions_UserId_Date_Operation");

            builder.HasOne(t => t.Investment)
                .WithMany(i => i.Transactions)
                .HasForeignKey(t => t.InvestmentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.LinkedTransaction)
                .WithMany()
                .HasForeignKey(t => t.LinkedTransactionId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
