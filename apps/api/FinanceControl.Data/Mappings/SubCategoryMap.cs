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
    public class SubcategoryMap : IEntityTypeConfiguration<SubCategory>
    {
        public void Configure(EntityTypeBuilder<SubCategory> builder)
        {
            builder.ToTable("SubCategories");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Name);
            builder.Property(s => s.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasDefaultValueSql("timezone('America/Sao_Paulo', now())")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(s => s.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.Category)
                .WithMany(c  => c.SubCategories)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
