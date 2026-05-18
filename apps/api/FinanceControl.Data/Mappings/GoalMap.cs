using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class GoalMap : IEntityTypeConfiguration<Goal>
    {
        public void Configure(EntityTypeBuilder<Goal> builder)
        {
            builder.ToTable("Goals");
            builder.HasKey(g => g.Id);
            builder.Property(g => g.Name).IsRequired().HasMaxLength(200);
            builder.Property(g => g.Description).HasMaxLength(1000);
            builder.Property(g => g.Type).HasConversion<string>().IsRequired();
            builder.Property(g => g.TargetAmount).IsRequired();
            builder.Property(g => g.Priority).HasConversion<string>().IsRequired();
            builder.Property(g => g.Status).HasConversion<string>().IsRequired();
            builder.Property(g => g.Color).HasMaxLength(7);
            builder.Property(g => g.Url).HasMaxLength(500);
            builder.Property(g => g.ImageUrl).HasMaxLength(500);
            builder.Property(g => g.TargetDate).IsRequired();
            builder.Property(g => g.TargetAssetType).HasConversion<string>();
            builder.Property(g => g.TargetTicker).HasMaxLength(20);
            builder.Property(g => g.IncludeInNetWorth);
            builder.Property(g => g.AchievedAt).HasColumnType("timestamp with time zone");
            builder.Property(g => g.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(g => g.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(g => g.Account)
                .WithMany()
                .HasForeignKey(g => g.AccountId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
