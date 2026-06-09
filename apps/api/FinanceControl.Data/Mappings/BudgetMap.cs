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
    public class BudgetMap : IEntityTypeConfiguration<Budget>
    {
        public void Configure(EntityTypeBuilder<Budget> builder)
        {
            builder.ToTable("Budgets");
            builder.HasKey(b => b.Id);
            builder.Property(b => b.StartDate);
            builder.Property(b => b.Recurrence)
                .HasConversion<string>();
            builder.Property(b => b.IsActive);
            builder.Property(b => b.CreatedAt)
                            .HasColumnType("timestamp with time zone")
                            .HasDefaultValueSql("now()")
                            .IsRequired()
                            .ValueGeneratedOnAdd();
            builder.Property(b => b.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(b => new { b.UserId, b.IsActive })
                .HasDatabaseName("IX_Budgets_UserId_IsActive");
        }
    }
}
