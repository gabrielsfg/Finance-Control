using FinanceControl.Shared.Dtos.Request.Simulation;
using FinanceControl.Shared.Dtos.Response.Simulation;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ISimulationService
    {
        Task<BenchmarkRatesDto> GetBenchmarkRatesAsync();
        Task<PortfolioBacktestDto> GetPortfolioBacktestAsync(
            IReadOnlyList<PortfolioAssetInputDto> assets,
            DateOnly startDate,
            DateOnly endDate,
            long monthlyContribution,
            long initialAmount);
        Task<HistoricalSimulationDto> GetHistoricalSimulationAsync(
            string benchmark,
            DateOnly startDate,
            DateOnly endDate,
            long monthlyContribution,
            long initialAmount);
        Task<List<AssetRateDto>> GetAssetRatesAsync(IEnumerable<string> tickers);
        Task<AssetRateDto?> GetAssetRateForPeriodAsync(string ticker, string period);
        Task<List<AvailableBenchmarkDto>> GetAvailableBenchmarksAsync();
    }
}
