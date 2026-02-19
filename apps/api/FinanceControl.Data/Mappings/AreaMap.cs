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
    public class AreaMap : IEntityTypeConfiguration<Area>
    {
        void IEntityTypeConfiguration<Area>.Configure(EntityTypeBuilder<Area> builder)
        {
            builder.ToTable("Areas");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Name);
            builder.Property(a => a.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasDefaultValueSql("timezone('America/Sao_Paulo', now())")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(a => a.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne<Budget>()
                .WithMany()
                .HasForeignKey(a => a.BudgetId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
