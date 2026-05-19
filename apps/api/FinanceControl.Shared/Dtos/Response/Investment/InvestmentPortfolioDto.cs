namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class InvestmentPortfolioDto
    {
        public List<InvestmentDto> Investments { get; set; } = [];
        public long CurrentValue { get; set; }
        public long TotalInvested { get; set; }
        public long TotalReturn { get; set; }
        public decimal TotalReturnPercent { get; set; }
        public List<AllocationDto> Allocations { get; set; } = [];
    }
}
