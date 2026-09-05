using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class AiGenerationLogMap : IEntityTypeConfiguration<AiGenerationLog>
    {
        public void Configure(EntityTypeBuilder<AiGenerationLog> builder)
        {
            builder.ToTable("AiGenerationLogs");
            builder.HasKey(l => l.Id);
            builder.Property(l => l.Kind).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(l => l.Outcome).HasConversion<string>().HasMaxLength(30).IsRequired();
            builder.Property(l => l.Model).HasMaxLength(60).IsRequired();
            builder.Property(l => l.RejectionReason).HasMaxLength(300);
            builder.Property(l => l.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired()
                .ValueGeneratedOnAdd();
            builder.Property(l => l.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .ValueGeneratedOnAdd();

            builder.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // The monthly quota counts rows in this table per user and month.
            builder.HasIndex(l => new { l.UserId, l.Kind, l.CreatedAt })
                .HasDatabaseName("IX_AiGenerationLogs_UserId_Kind_CreatedAt");
        }
    }
}
