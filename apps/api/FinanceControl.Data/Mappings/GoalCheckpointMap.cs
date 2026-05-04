using FinanceControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanceControl.Data.Mappings
{
    public class GoalCheckpointMap : IEntityTypeConfiguration<GoalCheckpoint>
    {
        public void Configure(EntityTypeBuilder<GoalCheckpoint> builder)
        {
            builder.ToTable("GoalCheckpoints");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Amount).IsRequired();
            builder.Property(c => c.RecordedAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            builder.HasOne(c => c.Goal)
                .WithMany(g => g.Checkpoints)
                .HasForeignKey(c => c.GoalId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
