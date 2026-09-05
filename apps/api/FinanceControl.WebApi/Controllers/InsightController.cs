using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    /// The AI analyses. Every endpoint here answers 204 rather than an error when there
    /// is nothing to show — free plan, feature disabled, quota spent or too little data
    /// are all normal states, and the client renders nothing instead of an error card.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InsightController : BaseController
    {
        private readonly IAiInsightService _aiInsightService;
        private readonly IValidator<UpsertAiContextRequestDto> _upsertAiContextValidator;

        public InsightController(
            IAiInsightService aiInsightService,
            IValidator<UpsertAiContextRequestDto> upsertAiContextValidator)
        {
            _aiInsightService = aiInsightService;
            _upsertAiContextValidator = upsertAiContextValidator;
        }

        [HttpGet("spending")]
        public async Task<IActionResult> GetSpendingInsightAsync()
        {
            var insight = await _aiInsightService.GetInsightAsync(EnumInsightKind.SpendingWeekly, GetUserId());

            return insight is null ? NoContent() : Ok(insight);
        }

        /// Regenerates within the same week, still subject to the monthly quota. Without
        /// it there is no way to exercise the feature in development without waiting for
        /// Monday.
        [HttpPost("spending/refresh")]
        public async Task<IActionResult> RefreshSpendingInsightAsync()
        {
            var insight = await _aiInsightService.GetInsightAsync(
                EnumInsightKind.SpendingWeekly, GetUserId(), forceRefresh: true);

            return insight is null ? NoContent() : Ok(insight);
        }

        [HttpGet("portfolio")]
        public async Task<IActionResult> GetPortfolioInsightAsync()
        {
            var insight = await _aiInsightService.GetInsightAsync(EnumInsightKind.PortfolioSnapshot, GetUserId());

            return insight is null ? NoContent() : Ok(insight);
        }

        [HttpGet("context")]
        public async Task<IActionResult> GetContextAsync()
        {
            var context = await _aiInsightService.GetContextAsync(GetUserId());

            return context is null ? NoContent() : Ok(context);
        }

        [HttpPut("context")]
        public async Task<IActionResult> UpsertContextAsync([FromBody] UpsertAiContextRequestDto requestDto)
        {
            var validationResult = _upsertAiContextValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var context = await _aiInsightService.UpsertContextAsync(requestDto, GetUserId());

            return Ok(context);
        }
    }
}
