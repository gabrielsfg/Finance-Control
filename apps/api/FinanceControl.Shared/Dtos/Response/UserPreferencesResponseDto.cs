namespace FinanceControl.Shared.Dtos.Response
{
    public class UserPreferencesResponseDto
    {
        public string CurrencyCode { get; set; } = string.Empty;
        public string Locale { get; set; } = string.Empty;
    }
}
