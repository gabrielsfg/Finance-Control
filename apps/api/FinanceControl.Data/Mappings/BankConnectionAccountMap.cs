using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class BankConnectionAccountMap : IEntityTypeConfiguration<BankConnectionAccount>
    {
        public void Configure(EntityTypeBuilder<BankConnectionAccount> builder)
        {
            builder.ToTable("BankConnectionAccounts");
            builder.HasKey(a => a.Id);

            builder.Property(a => a.ExternalAccountId).HasMaxLength(100).IsRequired();
            builder.Property(a => a.ExternalType).HasMaxLength(30).IsRequired();
            builder.Property(a => a.ExternalSubtype).HasMaxLength(40);
            builder.Property(a => a.Name).HasMaxLength(200).IsRequired();
            builder.Property(a => a.Number).HasMaxLength(60);
            builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

            builder.Property(a => a.InitialImportCompletedAt).HasColumnType("timestamp with time zone");
            builder.Property(a => a.ExternalBalanceAt).HasColumnType("timestamp with time zone");
            builder.Property(a => a.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(a => a.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(a => a.BankConnection)
                .WithMany(c => c.Accounts)
                .HasForeignKey(a => a.BankConnectionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Deleting the app account only unlinks it; the bank account stays listed.
            builder.HasOne(a => a.Account)
                .WithMany()
                .HasForeignKey(a => a.AccountId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(a => a.ExternalAccountId).IsUnique();
            builder.HasIndex(a => a.AccountId);
        }
    }
}
