using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class UserAiContextMap : IEntityTypeConfiguration<UserAiContext>
    {
        public void Configure(EntityTypeBuilder<UserAiContext> builder)
        {
            builder.ToTable("UserAiContexts");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.PeriodStart).IsRequired();
            builder.Property(c => c.Text).HasMaxLength(500).IsRequired();
            builder.Property(c => c.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(c => c.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(c => new { c.UserId, c.PeriodStart })
                .IsUnique()
                .HasDatabaseName("IX_UserAiContexts_UserId_PeriodStart");
        }
    }
}
