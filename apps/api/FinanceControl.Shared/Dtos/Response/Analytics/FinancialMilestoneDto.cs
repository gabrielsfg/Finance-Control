namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class FinancialMilestonesDto
    {
        public List<FinancialMilestoneDto> Milestones { get; set; } = [];
        public List<NetWorthTimelinePointDto> Timeline { get; set; } = [];
    }

    public class FinancialMilestoneDto
    {
        public string Label { get; set; } = "";
        public DateOnly Date { get; set; }
        public int NetWorthAtDate { get; set; }
        public string Type { get; set; } = "";
    }

    public class NetWorthTimelinePointDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int NetWorth { get; set; }
    }
}
