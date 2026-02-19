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
    public class BudgetSubcategoryAllocationMap : IEntityTypeConfiguration<BudgetSubcategoryAllocation>
    {
        public void Configure(EntityTypeBuilder<BudgetSubcategoryAllocation> builder)
        {
            builder.ToTable("BudgetSubcategoryAllocations");
            builder.HasKey(bsa => bsa.Id);
            builder.Property(bsa => bsa.SubCategoryId);
            builder.Property(bsa => bsa.ExpectedValue);
            builder.Property(bsa => bsa.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasDefaultValueSql("timezone('America/Sao_Paulo', now())")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(bsa => bsa.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(bsa => bsa.Budget)
                .WithMany(b => b.BudgetSubcategoryAllocations)
                .HasForeignKey(bsa => bsa.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(bsa => bsa.Area)
                .WithMany(a => a.BudgetSubcategoryAllocations)
                .HasForeignKey(bsa => bsa.AreaId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(bsa => bsa.SubCategory)
                .WithMany(sc => sc.BudgetSubcategoryAllocations)
                .HasForeignKey(bsa => bsa.SubCategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
