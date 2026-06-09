using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request.Simulation;
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

        [HttpGet("asset-rate")]
        public async Task<IActionResult> GetAssetRateForPeriodAsync([FromQuery] string ticker, [FromQuery] string period)
        {
            if (string.IsNullOrWhiteSpace(ticker) || ticker.Length > 20)
                return BadRequest(new { error = "Ticker inválido." });

            var validPeriods = new HashSet<string> { "7D", "30D", "1A", "2A", "5A", "10A", "15A" };
            if (!validPeriods.Contains(period))
                return BadRequest(new { error = "Período inválido. Use: 7D, 30D, 1A, 2A, 5A, 10A ou 15A." });

            var result = await _simulationService.GetAssetRateForPeriodAsync(ticker, period);
            if (result is null)
                return BadRequest(new { error = "Período inválido." });

            return Ok(result);
        }

        [HttpGet("available-benchmarks")]
        public async Task<IActionResult> GetAvailableBenchmarksAsync()
        {
            var result = await _simulationService.GetAvailableBenchmarksAsync();
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
            var fixedBenchmarks = new HashSet<string>
                { "CDI", "SELIC", "IPCA+6", "IPCA+5", "IPCA+4", "IBOVESPA", "IFIX", "SP500_BRL" };

            // Allow any non-empty ticker string (DB-backed dynamic benchmarks) in addition to the fixed set.
            if (string.IsNullOrWhiteSpace(benchmark) || (!fixedBenchmarks.Contains(benchmark) && benchmark.Length > 20))
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

        [HttpPost("portfolio/backtest")]
        public async Task<IActionResult> GetPortfolioBacktestAsync([FromBody] PortfolioBacktestRequestDto request)
        {
            if (request is null || request.Assets is null || request.Assets.Count < 2)
                return BadRequest(new { error = "A carteira deve ter pelo menos 2 ativos." });

            if (request.Assets.Count > 10)
                return BadRequest(new { error = "A carteira pode ter no máximo 10 ativos." });

            if (request.Assets.Any(a => string.IsNullOrWhiteSpace(a.Ticker) || a.Ticker.Length > 20))
                return BadRequest(new { error = "Ticker inválido em um dos ativos." });

            if (request.Assets.Any(a => a.WeightPct <= 0 || a.WeightPct > 100))
                return BadRequest(new { error = "O peso de cada ativo deve estar entre 0 e 100%." });

            var totalWeight = request.Assets.Sum(a => a.WeightPct);
            if (Math.Abs(totalWeight - 100.0) > 0.5)
                return BadRequest(new { error = "A soma dos pesos deve ser 100%." });

            if (request.StartDate >= request.EndDate)
                return BadRequest(new { error = "A data inicial deve ser anterior à data final." });

            if (request.MonthlyContribution < 0 || request.InitialAmount < 0)
                return BadRequest(new { error = "Valores não podem ser negativos." });

            var maxRange = DateOnly.FromDateTime(DateTime.UtcNow);
            var endDate = request.EndDate > maxRange ? maxRange : request.EndDate;

            var result = await _simulationService.GetPortfolioBacktestAsync(
                request.Assets, request.StartDate, endDate, request.MonthlyContribution, request.InitialAmount);

            return Ok(result);
        }
    }
}
