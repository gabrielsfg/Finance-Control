namespace FinanceControl.Shared.Dtos.Response.Analytics
{
    public class CategoryProjectionDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int SpentSoFar { get; set; }
        public int ProjectedTotal { get; set; }
        public decimal HistoricalMonthlyAvg { get; set; }
        public decimal MonthElapsedPercent { get; set; }
        public decimal SpentPercent { get; set; }
    }
}
