using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Data.Mappings
{
    public class TransactionMap : IEntityTypeConfiguration<Transaction>
    {
        public void Configure(EntityTypeBuilder<Transaction> builder)
        {
            builder.ToTable("Transactions");
            builder.HasKey(t => t.Id);
            builder.Property(t => t.Value).IsRequired();
            builder.Property(t => t.Type)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(t => t.Description).IsRequired();
            builder.Property(t => t.TransactionDate).IsRequired();
            builder.Property(t => t.PaymentType)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(t => t.InstallmentNumber);
            builder.Property(t => t.TotalInstallments);
            builder.Property(t => t.IsPaid).IsRequired();
            builder.Property(t => t.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasDefaultValueSql("timezone('America/Sao_Paulo', now())")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(t => t.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.Budget)
                .WithMany(b => b.Transactions)
                .HasForeignKey(t => t.BudgetId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(t => t.SubCategory)
                .WithMany(s => s.Transactions)
                .HasForeignKey(t => t.SubCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.RecurringTransaction)
                .WithMany(rt => rt.Transactions)
                .HasForeignKey(t => t.RecurringTransactionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(t => t.ParentTransaction)
                .WithMany(t => t.Installments)
                .HasForeignKey(t => t.ParentTransactionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
