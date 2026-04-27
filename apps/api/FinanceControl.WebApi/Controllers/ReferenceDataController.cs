using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api")]
    [ApiController]
    [Authorize]
    public class ReferenceDataController : BaseController
    {
        private readonly ICurrencyService _currencyService;
        private readonly IBankService _bankService;

        public ReferenceDataController(ICurrencyService currencyService, IBankService bankService)
        {
            _currencyService = currencyService;
            _bankService = bankService;
        }

        [HttpGet("currencies")]
        public async Task<IActionResult> GetCurrencyRatesAsync([FromQuery] string @base = "USD")
        {
            var rates = await _currencyService.GetRatesAsync(@base);
            return Ok(rates);
        }

        [HttpGet("banks")]
        public IActionResult GetBanks([FromQuery] string country)
        {
            if (string.IsNullOrWhiteSpace(country))
                return BadRequest("country query parameter is required.");

            var banks = _bankService.GetBanks(country);
            return Ok(banks);
        }
    }
}
