using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
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
        public async Task<IActionResult> GetSummaryAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] List<int>? accountIds,
            [FromQuery] List<int>? categoryIds,
            [FromQuery] EnumTransactionType? transactionType,
            [FromQuery] EnumPaymentType? paymentType)
        {
            var filter = BuildFilter(startDate, finishDate, accountIds, categoryIds, transactionType, paymentType);
            var result = await _analyticsService.GetSummaryAsync(filter);
            return Ok(result);
        }

        [HttpGet("income-expense")]
        public async Task<IActionResult> GetIncomeExpenseAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] List<int>? accountIds,
            [FromQuery] List<int>? categoryIds,
            [FromQuery] EnumTransactionType? transactionType,
            [FromQuery] EnumPaymentType? paymentType)
        {
            var filter = BuildFilter(startDate, finishDate, accountIds, categoryIds, transactionType, paymentType);
            var result = await _analyticsService.GetIncomeExpenseAsync(filter);
            return Ok(result);
        }

        [HttpGet("balance-evolution")]
        public async Task<IActionResult> GetBalanceEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] List<int>? accountIds,
            [FromQuery] List<int>? categoryIds,
            [FromQuery] EnumTransactionType? transactionType,
            [FromQuery] EnumPaymentType? paymentType)
        {
            var filter = BuildFilter(startDate, finishDate, accountIds, categoryIds, transactionType, paymentType);
            var result = await _analyticsService.GetBalanceEvolutionAsync(filter);
            return Ok(result);
        }

        [HttpGet("expenses-by-category")]
        public async Task<IActionResult> GetExpensesByCategoryAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] List<int>? accountIds,
            [FromQuery] EnumPaymentType? paymentType)
        {
            var filter = BuildFilter(startDate, finishDate, accountIds, categoryIds: null, transactionType: null, paymentType);
            var result = await _analyticsService.GetExpensesByCategoryAsync(filter);
            return Ok(result);
        }

        [HttpGet("category-evolution")]
        public async Task<IActionResult> GetCategoryEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate,
            [FromQuery] int categoryId,
            [FromQuery] List<int>? accountIds,
            [FromQuery] EnumPaymentType? paymentType)
        {
            var categoryValidation = this.ValidatePositiveId(categoryId, "categoryId");
            if (categoryValidation is not null) return categoryValidation;

            var filter = BuildFilter(startDate, finishDate, accountIds, categoryIds: null, transactionType: null, paymentType);
            var result = await _analyticsService.GetCategoryEvolutionAsync(filter, categoryId);
            return Ok(result);
        }

        [HttpGet("net-worth-evolution")]
        public async Task<IActionResult> GetNetWorthEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var filter = BuildFilter(startDate, finishDate, accountIds: null, categoryIds: null, transactionType: null, paymentType: null);
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
            [FromQuery] List<int>? accountIds,
            [FromQuery] List<int>? categoryIds,
            [FromQuery] EnumTransactionType? transactionType,
            [FromQuery] EnumPaymentType? paymentType)
        {
            var filter = BuildFilter(startDate, finishDate, accountIds, categoryIds, transactionType, paymentType);
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

        [HttpGet("projection/passive-income")]
        public async Task<IActionResult> GetPassiveIncomeProjectionAsync([FromQuery] int projectionMonths = 24)
        {
            if (projectionMonths < 6 || projectionMonths > 120)
                return BadRequest(new { error = "projectionMonths must be between 6 and 120." });

            var result = await _analyticsService.GetPassiveIncomeProjectionAsync(GetUserId(), projectionMonths);
            return Ok(result);
        }

        [HttpGet("milestones")]
        public async Task<IActionResult> GetFinancialMilestonesAsync()
        {
            var result = await _analyticsService.GetFinancialMilestonesAsync(GetUserId());
            return Ok(result);
        }

        [HttpGet("projection/portfolio-composition")]
        public async Task<IActionResult> GetPortfolioCompositionProjectionAsync([FromQuery] int projectionMonths = 12)
        {
            if (projectionMonths < 1 || projectionMonths > 60)
                return BadRequest(new { error = "projectionMonths must be between 1 and 60." });

            var result = await _analyticsService.GetPortfolioCompositionProjectionAsync(GetUserId(), projectionMonths);
            return Ok(result);
        }

        [HttpGet("real-net-worth")]
        public async Task<IActionResult> GetRealNetWorthAsync()
        {
            var result = await _analyticsService.GetRealNetWorthAsync(GetUserId());
            return Ok(result);
        }

        [HttpGet("investment/evolution")]
        public async Task<IActionResult> GetInvestmentEvolutionAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var result = await _analyticsService.GetInvestmentEvolutionAsync(GetUserId(), startDate, finishDate);
            return Ok(result);
        }

        [HttpGet("investment/profitability-totals")]
        public async Task<IActionResult> GetInvestmentProfitabilityTotalsAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var result = await _analyticsService.GetInvestmentProfitabilityTotalsAsync(GetUserId(), startDate, finishDate);
            return Ok(result);
        }

        [HttpGet("investment/annual-returns")]
        public async Task<IActionResult> GetInvestmentAnnualReturnsAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var result = await _analyticsService.GetInvestmentAnnualReturnsAsync(GetUserId(), startDate, finishDate);
            return Ok(result);
        }

        [HttpGet("investment/profitability-vs-cdi")]
        public async Task<IActionResult> GetInvestmentProfitabilityVsCdiAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var result = await _analyticsService.GetInvestmentProfitabilityVsCdiAsync(GetUserId(), startDate, finishDate);
            return Ok(result);
        }

        [HttpGet("investment/profitability-vs-benchmarks")]
        public async Task<IActionResult> GetInvestmentProfitabilityVsBenchmarksAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var result = await _analyticsService.GetInvestmentProfitabilityVsBenchmarksAsync(GetUserId(), startDate, finishDate);
            return Ok(result);
        }

        [HttpGet("investment/launches")]
        public async Task<IActionResult> GetInvestmentLaunchesAsync(
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            var result = await _analyticsService.GetInvestmentLaunchesAsync(GetUserId(), startDate, finishDate);
            return Ok(result);
        }

        private AnalyticsRequestDto BuildFilter(
            DateOnly startDate,
            DateOnly finishDate,
            List<int>? accountIds,
            List<int>? categoryIds,
            EnumTransactionType? transactionType,
            EnumPaymentType? paymentType) =>
            new()
            {
                StartDate       = startDate,
                FinishDate      = finishDate,
                AccountIds      = accountIds ?? [],
                CategoryIds     = categoryIds ?? [],
                TransactionType = transactionType,
                PaymentType     = paymentType,
                UserId          = GetUserId()
            };
    }
}
