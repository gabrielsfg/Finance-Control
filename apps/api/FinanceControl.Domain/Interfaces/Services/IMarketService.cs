using FinanceControl.Shared.Dtos.Response.Market;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IMarketService
    {
        Task<List<MarketAssetDto>> SearchAsync(string query);
        Task<List<MarketAssetDto>> ListAsync(string? assetType, string sort, int limit);
        Task<MarketAssetDetailDto> GetDetailAsync(string ticker);
        Task<FundamentalsDto> GetFundamentalsAsync(string ticker);
        Task<FiiIndicatorsDto> GetFiiIndicatorsAsync(string ticker);
        Task<List<MacroIndicatorDto>> GetMacroIndicatorsAsync();
    }
}
