using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
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
            builder.Property(t => t.PaymentMethod)
                .HasConversion<string>();
            builder.Property(t => t.InstallmentNumber);
            builder.Property(t => t.TotalInstallments);
            builder.Property(t => t.Source)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(EnumTransactionSource.Manual)
                .IsRequired();
            builder.Property(t => t.ExternalId).HasMaxLength(100);
            builder.Property(t => t.ExternalCounterpartId).HasMaxLength(100);
            builder.Property(t => t.ExternalProviderId).HasMaxLength(200);
            builder.Property(t => t.NeedsReview).HasDefaultValue(false).IsRequired();
            builder.Property(t => t.ExternalModified).HasDefaultValue(false).IsRequired();
            builder.Property(t => t.PossibleDuplicate).HasDefaultValue(false).IsRequired();
            builder.Property(t => t.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(t => t.UpdatedAt)
                .HasColumnType("timestamp with time zone")
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

            builder.HasOne(t => t.DestinationAccount)
                .WithMany(a => a.IncomingTransfers)
                .HasForeignKey(t => t.DestinationAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.RecurringTransaction)
                .WithMany(rt => rt.Transactions)
                .HasForeignKey(t => t.RecurringTransactionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(t => t.ParentTransaction)
                .WithMany(t => t.Installments)
                .HasForeignKey(t => t.ParentTransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(t => new { t.UserId, t.TransactionDate })
                .HasDatabaseName("IX_Transactions_UserId_TransactionDate");
            builder.HasIndex(t => new { t.UserId, t.Type, t.TransactionDate })
                .HasDatabaseName("IX_Transactions_UserId_Type_TransactionDate");
            builder.HasIndex(t => new { t.UserId, t.PaymentType, t.TransactionDate })
                .HasDatabaseName("IX_Transactions_UserId_PaymentType_TransactionDate");

            // Bank sync upserts on it; the uniqueness is the last line against a row
            // imported twice by two overlapping syncs.
            builder.HasIndex(t => new { t.UserId, t.ExternalId })
                .IsUnique()
                .HasFilter("\"ExternalId\" IS NOT NULL")
                .HasDatabaseName("IX_Transactions_UserId_ExternalId");

            // The "to review" badge counts these on every screen load.
            builder.HasIndex(t => new { t.UserId, t.NeedsReview })
                .HasFilter("\"NeedsReview\"")
                .HasDatabaseName("IX_Transactions_UserId_NeedsReview");
        }
    }
}
