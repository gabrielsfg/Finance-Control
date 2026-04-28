namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class CommitmentsImpactDto
    {
        public int CurrentBalance { get; set; }
        public List<CommitmentsImpactMonthDto> Months { get; set; } = [];
    }

    public class CommitmentsImpactMonthDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int ProjectedIncome { get; set; }
        public int TotalCommitments { get; set; }
        public int ProjectedBalance { get; set; }
        public bool IsNegative { get; set; }
        public List<CommitmentDetailDto> Commitments { get; set; } = [];
    }
}
