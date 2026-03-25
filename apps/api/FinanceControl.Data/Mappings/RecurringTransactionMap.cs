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
    public class RecurringTransactionMap : IEntityTypeConfiguration<RecurringTransaction>
    {
        public void Configure(EntityTypeBuilder<RecurringTransaction> builder)
        {
            builder.ToTable("RecurringTransactions");
            builder.HasKey(rt => rt.Id);
            builder.Property(rt => rt.Value).IsRequired();
            builder.Property(rt => rt.Type)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(rt => rt.Description).IsRequired();
            builder.Property(rt => rt.Recurrence)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(rt => rt.StartDate).IsRequired();
            builder.Property(rt => rt.EndDate);
            builder.Property(rt => rt.IsActive).IsRequired();
            builder.Property(rt => rt.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasDefaultValueSql("timezone('America/Sao_Paulo', now())")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(rt => rt.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(rt => rt.Budget)
                .WithMany(b => b.RecurringTransactions)
                .HasForeignKey(rt => rt.BudgetId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(rt => rt.SubCategory)
                .WithMany(s => s.RecurringTransactions)
                .HasForeignKey(rt => rt.SubCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(rt => rt.Account)
                .WithMany(a => a.RecurringTransactions)
                .HasForeignKey(rt => rt.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
