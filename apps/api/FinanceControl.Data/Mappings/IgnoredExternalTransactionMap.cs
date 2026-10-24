using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class IgnoredExternalTransactionMap : IEntityTypeConfiguration<IgnoredExternalTransaction>
    {
        public void Configure(EntityTypeBuilder<IgnoredExternalTransaction> builder)
        {
            builder.ToTable("IgnoredExternalTransactions");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.ExternalId).HasMaxLength(100).IsRequired();
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

            builder.HasIndex(i => new { i.UserId, i.ExternalId }).IsUnique();
        }
    }
}
