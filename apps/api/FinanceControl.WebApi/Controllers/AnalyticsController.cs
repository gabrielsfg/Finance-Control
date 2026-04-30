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
    public class AnalyticsController : BaseController
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummaryAsync([FromQuery] int lookbackMonths = 7)
        {
            if (lookbackMonths < 1 || lookbackMonths > 24)
                return BadRequest(new { error = "lookbackMonths must be between 1 and 24." });

            var result = await _analyticsService.GetSummaryAsync(GetUserId(), lookbackMonths);
            return Ok(result);
        }

        [HttpGet("income-expense")]
        public async Task<IActionResult> GetIncomeExpenseAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] int? accountId)
        {
            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            var filter = BuildFilter(startDate, finishDate, accountId);
            var result = await _analyticsService.GetIncomeExpenseAsync(filter);
            return Ok(result);
        }

        [HttpGet("balance-evolution")]
        public async Task<IActionResult> GetBalanceEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] int? accountId)
        {
            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            var filter = BuildFilter(startDate, finishDate, accountId);
            var result = await _analyticsService.GetBalanceEvolutionAsync(filter);
            return Ok(result);
        }

        [HttpGet("expenses-by-category")]
        public async Task<IActionResult> GetExpensesByCategoryAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] int? accountId)
        {
            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            var filter = BuildFilter(startDate, finishDate, accountId);
            var result = await _analyticsService.GetExpensesByCategoryAsync(filter);
            return Ok(result);
        }

        [HttpGet("category-evolution")]
        public async Task<IActionResult> GetCategoryEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] int categoryId,
            [FromQuery] int? accountId)
        {
            var categoryValidation = this.ValidatePositiveId(categoryId, "categoryId");
            if (categoryValidation is not null) return categoryValidation;

            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            var filter = BuildFilter(startDate, finishDate, accountId);
            var result = await _analyticsService.GetCategoryEvolutionAsync(filter, categoryId);
            return Ok(result);
        }

        [HttpGet("net-worth-evolution")]
        public async Task<IActionResult> GetNetWorthEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var filter = BuildFilter(startDate, finishDate, accountId: null);
            var result = await _analyticsService.GetNetWorthEvolutionAsync(filter);
            return Ok(result);
        }

        [HttpGet("future-commitments")]
        public async Task<IActionResult> GetFutureCommitmentsAsync([FromQuery] int months = 6)
        {
            if (months < 1 || months > 24)
                return BadRequest(new { error = "months must be between 1 and 24." });

            var result = await _analyticsService.GetFutureCommitmentsAsync(GetUserId(), months);
            return Ok(result);
        }

        [HttpGet("budget-pace")]
        public async Task<IActionResult> GetBudgetPaceAsync([FromQuery] int budgetId)
        {
            var validation = this.ValidatePositiveId(budgetId, "budgetId");
            if (validation is not null) return validation;

            var result = await _analyticsService.GetBudgetPaceAsync(budgetId, GetUserId());
            if (result is null) return NotFound();
            return Ok(result);
        }

        [HttpGet("spending-heatmap")]
        public async Task<IActionResult> GetSpendingHeatmapAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] int? accountId)
        {
            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            var filter = BuildFilter(startDate, finishDate, accountId);
            var result = await _analyticsService.GetSpendingHeatmapAsync(filter);
            return Ok(result);
        }

        [HttpGet("projection/balance")]
        public async Task<IActionResult> GetBalanceProjectionAsync(
            [FromQuery] int? accountId,
            [FromQuery] int lookbackDays = 30)
        {
            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            if (lookbackDays < 7 || lookbackDays > 365)
                return BadRequest(new { error = "lookbackDays must be between 7 and 365." });

            var result = await _analyticsService.GetBalanceProjectionAsync(GetUserId(), accountId, lookbackDays);
            return Ok(result);
        }

        [HttpGet("projection/categories")]
        public async Task<IActionResult> GetCategoryProjectionAsync(
            [FromQuery] int? accountId,
            [FromQuery] int lookbackMonths = 3)
        {
            if (accountId.HasValue)
            {
                var validation = this.ValidatePositiveId(accountId.Value, "accountId");
                if (validation is not null) return validation;
            }

            if (lookbackMonths < 1 || lookbackMonths > 12)
                return BadRequest(new { error = "lookbackMonths must be between 1 and 12." });

            var result = await _analyticsService.GetCategoryProjectionAsync(GetUserId(), accountId, lookbackMonths);
            return Ok(result);
        }

        [HttpGet("projection/net-worth")]
        public async Task<IActionResult> GetNetWorthProjectionAsync(
            [FromQuery] int projectionMonths = 12,
            [FromQuery] int? targetAmount = null)
        {
            if (projectionMonths < 1 || projectionMonths > 60)
                return BadRequest(new { error = "projectionMonths must be between 1 and 60." });

            if (targetAmount.HasValue && targetAmount.Value <= 0)
                return BadRequest(new { error = "targetAmount must be greater than 0." });

            var result = await _analyticsService.GetNetWorthProjectionAsync(GetUserId(), projectionMonths, targetAmount);
            return Ok(result);
        }

        [HttpGet("projection/commitments-impact")]
        public async Task<IActionResult> GetCommitmentsImpactAsync([FromQuery] int months = 6)
        {
            if (months < 1 || months > 24)
                return BadRequest(new { error = "months must be between 1 and 24." });

            var result = await _analyticsService.GetCommitmentsImpactAsync(GetUserId(), months);
            return Ok(result);
        }

        private AnalyticsRequestDto BuildFilter(DateOnly startDate, DateOnly finishDate, int? accountId) =>
            new()
            {
                StartDate = startDate,
                FinishDate = finishDate,
                AccountId = accountId,
                UserId = GetUserId()
            };
    }
}
