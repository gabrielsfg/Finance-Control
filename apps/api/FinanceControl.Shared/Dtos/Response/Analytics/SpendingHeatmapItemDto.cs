namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    /// <summary>Intensity state for a calendar day, pre-calculated by the backend.</summary>
    public enum DayHeatmapState
    {
        Empty,
        Expense1, Expense2, Expense3, Expense4,
        Income1,  Income2,  Income3,  Income4
    }

    public class SpendingHeatmapItemDto
    {
        public DateOnly Date { get; set; }
        public int Total { get; set; }   // expense in cents
        public int Income { get; set; }  // income in cents
        public int Net { get; set; }     // income - expense
        public DayHeatmapState State { get; set; }
    }
}
