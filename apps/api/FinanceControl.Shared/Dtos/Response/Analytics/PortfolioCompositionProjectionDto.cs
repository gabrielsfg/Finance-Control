namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class PortfolioCompositionProjectionDto
    {
        public List<PortfolioCompositionMonthDto> Data { get; set; } = [];
        public List<string> AssetClasses { get; set; } = [];
    }

    public class PortfolioCompositionMonthDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public bool IsProjected { get; set; }
        public List<AssetClassValueDto> Breakdown { get; set; } = [];
    }

    public class AssetClassValueDto
    {
        public string AssetClass { get; set; } = "";
        public int Value { get; set; }
    }
}
