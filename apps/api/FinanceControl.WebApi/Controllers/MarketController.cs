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

        [HttpGet("search")]
        public async Task<IActionResult> SearchAsync([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 1)
                return BadRequest(new { error = "Query must have at least 1 character." });

            var result = await _marketService.SearchAsync(q);
            return Ok(result);
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
    }
}
