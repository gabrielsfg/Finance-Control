using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class WishlistItemMap : IEntityTypeConfiguration<WishlistItem>
    {
        public void Configure(EntityTypeBuilder<WishlistItem> builder)
        {
            builder.ToTable("WishlistItems");
            builder.HasKey(w => w.Id);
            builder.Property(w => w.Name).IsRequired().HasMaxLength(200);
            builder.Property(w => w.Description).HasMaxLength(1000);
            builder.Property(w => w.TargetPrice);
            builder.Property(w => w.Priority).HasConversion<string>().IsRequired();
            builder.Property(w => w.Status).HasConversion<string>().IsRequired();
            builder.Property(w => w.Url).HasMaxLength(500);
            builder.Property(w => w.ImageUrl).HasMaxLength(500);
            builder.Property(w => w.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(w => w.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
