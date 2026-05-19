namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateUserPreferencesRequestDto
    {
        public string? CurrencyCode { get; set; }
        public string? Locale { get; set; }
        public string? Country { get; set; }
        public string? AnalyticsConfig { get; set; }
    }
}
