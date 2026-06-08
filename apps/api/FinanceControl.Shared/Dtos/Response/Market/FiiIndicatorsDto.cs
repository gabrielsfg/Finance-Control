namespace FinanceControl.Shared.Dtos.Response.Market
{
    // FII-specific indicators from Brapi /api/v2/fii/list (Pro plan). FIIs are not covered
    // by the generic fundamentals modules, so this fills that gap.
    public class FiiIndicatorsDto
    {
        public string Ticker { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? SegmentType { get; set; }       // papel | tijolo | hibrido | fof
        public string? Segment { get; set; }            // segmentoAtuacao (sector)
        public string? ManagementType { get; set; }     // tipoGestao
        public string? Mandate { get; set; }
        public string? AdministratorName { get; set; }
        public decimal? Price { get; set; }
        public decimal? NavPerShare { get; set; }       // valor patrimonial por cota
        public decimal? PriceToNav { get; set; }        // P/VP
        public decimal? DividendYield12m { get; set; }
        public long? TotalInvestors { get; set; }
        public System.DateTime FetchedAt { get; set; }
    }
}
