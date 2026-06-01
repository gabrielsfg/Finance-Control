using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SimulationController : BaseController
    {
        private readonly ISimulationService _simulationService;

        public SimulationController(ISimulationService simulationService)
        {
            _simulationService = simulationService;
        }

        [HttpGet("benchmark-rates")]
        public async Task<IActionResult> GetBenchmarkRatesAsync()
        {
            var result = await _simulationService.GetBenchmarkRatesAsync();
            return Ok(result);
        }

        [HttpGet("asset-rates")]
        public async Task<IActionResult> GetAssetRatesAsync([FromQuery] string tickers)
        {
            if (string.IsNullOrWhiteSpace(tickers))
                return BadRequest(new { error = "O parâmetro 'tickers' é obrigatório." });

            var tickerList = tickers
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Take(30)
                .Distinct(StringComparer.OrdinalIgnoreCase);

            var result = await _simulationService.GetAssetRatesAsync(tickerList);
            return Ok(result);
        }

        [HttpGet("historical")]
        public async Task<IActionResult> GetHistoricalSimulationAsync(
            [FromQuery] string benchmark,
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly endDate,
            [FromQuery] long monthlyContribution,
            [FromQuery] long initialAmount = 0)
        {
            var validBenchmarks = new HashSet<string>
                { "CDI", "SELIC", "IPCA+6", "IPCA+5", "IPCA+4", "IBOVESPA", "IFIX", "SP500_BRL" };

            if (!validBenchmarks.Contains(benchmark))
                return BadRequest(new { error = "Benchmark inválido." });

            if (startDate >= endDate)
                return BadRequest(new { error = "A data inicial deve ser anterior à data final." });

            if (monthlyContribution < 0 || initialAmount < 0)
                return BadRequest(new { error = "Valores não podem ser negativos." });

            var maxRange = DateOnly.FromDateTime(DateTime.UtcNow);
            if (endDate > maxRange)
                endDate = maxRange;

            var result = await _simulationService.GetHistoricalSimulationAsync(
                benchmark, startDate, endDate, monthlyContribution, initialAmount);

            return Ok(result);
        }
    }
}
