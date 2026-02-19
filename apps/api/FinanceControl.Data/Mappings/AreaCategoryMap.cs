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
    public class AreaCategoryMap : IEntityTypeConfiguration<AreaCategory>
    {
        void IEntityTypeConfiguration<AreaCategory>.Configure(EntityTypeBuilder<AreaCategory> builder)
        {
            builder.ToTable("AreaCategories");
            builder.HasKey(ac => ac.Id);
            builder.Property(ac => ac.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasDefaultValueSql("timezone('America/Sao_Paulo', now())")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(ac => ac.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(ac => ac.Area)
           .WithMany(a => a.AreaCategories)
           .HasForeignKey(ac => ac.AreaId)
           .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ac => ac.Category)
                .WithMany(c => c.AreaCategories)
                .HasForeignKey(ac => ac.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
