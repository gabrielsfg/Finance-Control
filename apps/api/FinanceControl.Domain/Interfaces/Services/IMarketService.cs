using FinanceControl.Shared.Dtos.Response.Market;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IMarketService
    {
        Task<List<MarketAssetDto>> SearchAsync(string query);
        Task<MarketAssetDetailDto> GetDetailAsync(string ticker);
    }
}
