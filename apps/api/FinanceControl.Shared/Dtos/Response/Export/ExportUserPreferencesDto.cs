namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportUserPreferencesDto
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public string Locale { get; set; } = string.Empty;
        public string AnalyticsConfig { get; set; } = string.Empty;
    }
}
