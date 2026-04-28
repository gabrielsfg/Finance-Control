namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class FutureCommitmentsItemDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalCommitted { get; set; }
        public List<CommitmentDetailDto> Installments { get; set; } = [];
    }

    public class CommitmentDetailDto
    {
        public string Description { get; set; } = string.Empty;
        public int Value { get; set; }
    }
}
