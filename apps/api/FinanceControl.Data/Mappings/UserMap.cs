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
    public class UserMap : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");
            builder.HasKey(u => u.Id);
            builder.Property(u => u.Email);
            builder.Property(u => u.PasswordHash);
            builder.Property(u => u.Name);
            builder.Property(u => u.IsActive).HasDefaultValue(1);
            builder.Property(u => u.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(u => u.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();
            builder.Property(u => u.FailedLoginAttempts).HasDefaultValue(0).IsRequired();
            builder.Property(u => u.LockoutEnd)
                .HasColumnType("timestamp with time zone");
            builder.Property(u => u.PreferredCurrency).HasDefaultValue("BRL").IsRequired();
            builder.Property(u => u.PreferredLanguage).HasDefaultValue("pt-BR").IsRequired();
            builder.Property(u => u.Country).HasMaxLength(2);
        }
    }
}
