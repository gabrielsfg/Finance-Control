using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvestmentController : BaseController
    {
        private readonly IInvestmentService _investmentService;

        public InvestmentController(IInvestmentService investmentService)
        {
            _investmentService = investmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPortfolioAsync()
        {
            var result = await _investmentService.GetPortfolioAsync(GetUserId());
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync([FromRoute] int id)
        {
            var validation = this.ValidatePositiveId(id, "id");
            if (validation is not null) return validation;

            try
            {
                var result = await _investmentService.GetByIdAsync(id, GetUserId());
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Investment not found." });
            }
        }

        [HttpGet("{id:int}/transactions")]
        public async Task<IActionResult> GetTransactionsAsync([FromRoute] int id)
        {
            var validation = this.ValidatePositiveId(id, "id");
            if (validation is not null) return validation;

            var result = await _investmentService.GetTransactionsAsync(id, GetUserId());
            return Ok(result);
        }

        [HttpGet("{id:int}/dividends")]
        public async Task<IActionResult> GetDividendsAsync([FromRoute] int id)
        {
            var validation = this.ValidatePositiveId(id, "id");
            if (validation is not null) return validation;

            var result = await _investmentService.GetDividendsAsync(id, GetUserId());
            return Ok(result);
        }

        [HttpPost("transactions")]
        public async Task<IActionResult> RegisterTransactionAsync([FromBody] CreateInvestmentTransactionRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Ticker))
                return BadRequest(new { error = "Ticker is required." });

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { error = "Name is required." });

            if (dto.Quantity <= 0)
                return BadRequest(new { error = "Quantity must be greater than 0." });

            if (dto.UnitPrice <= 0)
                return BadRequest(new { error = "UnitPrice must be greater than 0." });

            if (dto.OtherCosts < 0)
                return BadRequest(new { error = "OtherCosts cannot be negative." });

            var accountValidation = this.ValidatePositiveId(dto.AccountId, "accountId");
            if (accountValidation is not null) return accountValidation;

            try
            {
                var result = await _investmentService.RegisterTransactionAsync(GetUserId(), dto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("transactions/{id:int}")]
        public async Task<IActionResult> DeleteTransactionAsync([FromRoute] int id)
        {
            var validation = this.ValidatePositiveId(id, "id");
            if (validation is not null) return validation;

            try
            {
                var result = await _investmentService.DeleteTransactionAsync(id, GetUserId());
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Investment transaction not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("dividends")]
        public async Task<IActionResult> RegisterDividendAsync([FromBody] CreateInvestmentDividendRequestDto dto)
        {
            var investmentValidation = this.ValidatePositiveId(dto.InvestmentId, "investmentId");
            if (investmentValidation is not null) return investmentValidation;

            if (dto.Amount <= 0)
                return BadRequest(new { error = "Amount must be greater than 0." });

            var accountValidation = this.ValidatePositiveId(dto.AccountId, "accountId");
            if (accountValidation is not null) return accountValidation;

            try
            {
                var result = await _investmentService.RegisterDividendAsync(GetUserId(), dto);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Investment not found." });
            }
        }

        [HttpGet("{id:int}/price-history")]
        public async Task<IActionResult> GetPriceHistoryAsync([FromRoute] int id)
        {
            var validation = this.ValidatePositiveId(id, "id");
            if (validation is not null) return validation;

            try
            {
                var result = await _investmentService.GetPriceHistoryAsync(id, GetUserId());
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Investment not found." });
            }
        }

        [HttpPatch("{id:int}/price")]
        public async Task<IActionResult> UpdatePriceAsync([FromRoute] int id, [FromBody] UpdateInvestmentPriceRequestDto dto)
        {
            var validation = this.ValidatePositiveId(id, "id");
            if (validation is not null) return validation;

            if (dto.CurrentPrice <= 0)
                return BadRequest(new { error = "CurrentPrice must be greater than 0." });

            try
            {
                var result = await _investmentService.UpdatePriceAsync(id, GetUserId(), dto);
                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Investment not found." });
            }
        }
    }
}
