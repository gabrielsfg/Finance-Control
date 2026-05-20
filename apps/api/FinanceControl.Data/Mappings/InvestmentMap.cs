using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class InvestmentMap : IEntityTypeConfiguration<Investment>
    {
        public void Configure(EntityTypeBuilder<Investment> builder)
        {
            builder.ToTable("Investments");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Ticker).IsRequired();
            builder.Property(i => i.Name).IsRequired();
            builder.Property(i => i.AssetType)
                .HasConversion<string>()
                .IsRequired();
            builder.Property(i => i.Broker);
            builder.Property(i => i.CurrentQuantity).IsRequired();
            builder.Property(i => i.AveragePrice).IsRequired();
            builder.Property(i => i.CurrentPrice).IsRequired();
            builder.Property(i => i.LastPriceUpdate)
                .HasColumnType("timestamp with time zone");
            builder.Property(i => i.MaturityDate);
            builder.Property(i => i.ExpectedYieldPct);
            builder.Property(i => i.LogoUrl).HasColumnType("text");
            builder.Property(i => i.Currency)
                .IsRequired()
                .HasDefaultValue("BRL");
            builder.Property(i => i.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(i => i.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(i => i.Account)
                .WithMany()
                .HasForeignKey(i => i.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
