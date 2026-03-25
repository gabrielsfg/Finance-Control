using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MainPageController : BaseController
    {
        private readonly ITransactionService _transactionService;

        public MainPageController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetMainPageSummaryAsync(
            [FromQuery] int? budgetId,
            [FromQuery] DateOnly startDate,
            [FromQuery] DateOnly finishDate)
        {
            if (budgetId.HasValue)
            {
                var validationResult = this.ValidatePositiveId(budgetId.Value, "budgetId");
                if (validationResult is not null)
                    return validationResult;
            }

            var userId = GetUserId();

            var filter = new MainPageSummaryRequestDto
            {
                BudgetId = budgetId,
                StartDate = startDate,
                FinishDate = finishDate,
                UserId = userId
            };

            var balanceTask = _transactionService.GetSummaryBalanceAsync(filter);
            var recentTask = _transactionService.GetRecentTransactionsAsync(filter);
            var budgetTask = _transactionService.GetBudgetSummaryAsync(filter);
            var topCategoriesTask = _transactionService.GetTopCategoriesAsync(filter);

            await Task.WhenAll(balanceTask, recentTask, budgetTask, topCategoriesTask);

            var result = new MainPageSummaryResponseDto
            {
                BalanceSummary = balanceTask.Result,
                RecentTransactions = recentTask.Result,
                BudgetSummary = budgetTask.Result,
                TopCategories = topCategoriesTask.Result
            };

            return Ok(result);
        }
    }
}
