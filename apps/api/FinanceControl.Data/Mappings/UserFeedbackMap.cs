using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class UserFeedbackMap : IEntityTypeConfiguration<UserFeedback>
    {
        public void Configure(EntityTypeBuilder<UserFeedback> builder)
        {
            builder.ToTable("UserFeedbacks");
            builder.HasKey(f => f.Id);
            builder.Property(f => f.Type).HasConversion<string>().IsRequired();
            builder.Property(f => f.Title).IsRequired().HasMaxLength(120);
            builder.Property(f => f.Description).HasMaxLength(2000);
            builder.Property(f => f.Status).HasConversion<string>().IsRequired();
            builder.Property(f => f.Source).HasMaxLength(20);
            builder.Property(f => f.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(f => f.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Triage reads the table newest-first, filtered by status.
            builder.HasIndex(f => new { f.Status, f.CreatedAt })
                .HasDatabaseName("IX_UserFeedbacks_Status_CreatedAt");
        }
    }
}
