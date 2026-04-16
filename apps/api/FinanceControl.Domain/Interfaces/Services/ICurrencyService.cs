using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ICurrencyService
    {
        Task<IReadOnlyList<CurrencyRateResponseDto>> GetRatesAsync(string baseCurrency);
    }
}
