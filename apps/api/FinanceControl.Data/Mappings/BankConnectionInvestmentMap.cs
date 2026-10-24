using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class BankConnectionInvestmentMap : IEntityTypeConfiguration<BankConnectionInvestment>
    {
        public void Configure(EntityTypeBuilder<BankConnectionInvestment> builder)
        {
            builder.ToTable("BankConnectionInvestments");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.ExternalInvestmentId).HasMaxLength(100).IsRequired();
            builder.Property(i => i.Name).HasMaxLength(200).IsRequired();
            builder.Property(i => i.Code).HasMaxLength(40);
            builder.Property(i => i.ExternalType).HasMaxLength(30).IsRequired();
            builder.Property(i => i.ExternalSubtype).HasMaxLength(60);
            builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            builder.Property(i => i.Quantity).HasPrecision(28, 10);
            builder.Property(i => i.LastSyncedAt).HasColumnType("timestamp with time zone");
            builder.Property(i => i.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(i => i.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(i => i.BankConnection)
                .WithMany(c => c.Investments)
                .HasForeignKey(i => i.BankConnectionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Deleting the position by hand only unlinks it; the sync then leaves it alone.
            builder.HasOne(i => i.Investment)
                .WithMany()
                .HasForeignKey(i => i.InvestmentId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(i => i.ExternalInvestmentId).IsUnique();
            builder.HasIndex(i => i.InvestmentId);
        }
    }
}
