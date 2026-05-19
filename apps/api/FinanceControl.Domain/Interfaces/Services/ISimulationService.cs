using FinanceControl.Shared.Dtos.Response.Simulation;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ISimulationService
    {
        Task<BenchmarkRatesDto> GetBenchmarkRatesAsync();
        Task<HistoricalSimulationDto> GetHistoricalSimulationAsync(
            string benchmark,
            DateOnly startDate,
            DateOnly endDate,
            long monthlyContribution,
            long initialAmount);
    }
}
