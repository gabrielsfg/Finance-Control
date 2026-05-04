namespace FinanceControl.Domain.Entities
{
    public class GoalCheckpoint
    {
        public int Id { get; set; }
        public int GoalId { get; set; }
        public int Amount { get; set; }
        public DateTime RecordedAt { get; set; }

        public Goal Goal { get; set; } = null!;
    }
}
