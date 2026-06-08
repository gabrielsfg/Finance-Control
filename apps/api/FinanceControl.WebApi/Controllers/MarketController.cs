using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MarketController : BaseController
    {
        private readonly IMarketService _marketService;

        public MarketController(IMarketService marketService)
        {
            _marketService = marketService;
        }

        [HttpGet]
        public async Task<IActionResult> ListAsync(
            [FromQuery] string? type = null,
            [FromQuery] string sort = "change_desc",
            [FromQuery] int limit = 20)
        {
            limit = Math.Clamp(limit, 1, 100);
            var result = await _marketService.ListAsync(type, sort, limit);
            return Ok(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchAsync([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 1)
                return BadRequest(new { error = "Query must have at least 1 character." });

            var result = await _marketService.SearchAsync(q);
            return Ok(result);
        }

        [HttpGet("{ticker}/fii")]
        public async Task<IActionResult> GetFiiIndicatorsAsync([FromRoute] string ticker)
        {
            if (string.IsNullOrWhiteSpace(ticker))
                return BadRequest(new { error = "Ticker is required." });

            try
            {
                var result = await _marketService.GetFiiIndicatorsAsync(ticker);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"No FII data found for '{ticker}'." });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(503, new { error = ex.Message });
            }
        }

        [HttpGet("macro")]
        public async Task<IActionResult> GetMacroIndicatorsAsync()
        {
            try
            {
                var result = await _marketService.GetMacroIndicatorsAsync();
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(503, new { error = ex.Message });
            }
        }

        [HttpGet("{ticker}")]
        public async Task<IActionResult> GetDetailAsync([FromRoute] string ticker)
        {
            if (string.IsNullOrWhiteSpace(ticker))
                return BadRequest(new { error = "Ticker is required." });

            try
            {
                var result = await _marketService.GetDetailAsync(ticker);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Ticker '{ticker}' not found." });
            }
        }

        [HttpGet("{ticker}/fundamentals")]
        public async Task<IActionResult> GetFundamentalsAsync([FromRoute] string ticker)
        {
            if (string.IsNullOrWhiteSpace(ticker))
                return BadRequest(new { error = "Ticker is required." });

            try
            {
                var result = await _marketService.GetFundamentalsAsync(ticker);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"No fundamentals data found for '{ticker}'." });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(503, new { error = ex.Message });
            }
        }
    }
}
