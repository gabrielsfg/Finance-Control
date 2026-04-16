namespace FinanceControl.Shared.Dtos.Response
{
    public class CurrencyRateResponseDto
    {
        public string Code { get; init; } = string.Empty;
        public decimal Rate { get; init; }
    }
}
