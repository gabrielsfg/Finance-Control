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
    /// The AI analyses. Every analysis endpoint answers 200 with a status — free plan, AI
    /// switched off, feature disabled, quota spent or too little data are all normal
    /// states, and the client picks the card to render from the status.
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
            var result = await _aiInsightService.GetInsightAsync(EnumInsightKind.SpendingWeekly, GetUserId());

            return Ok(result);
        }

        /// Regenerates within the same week, still subject to the monthly quota. Without
        /// it there is no way to exercise the feature in development without waiting for
        /// Monday.
        [HttpPost("spending/refresh")]
        public async Task<IActionResult> RefreshSpendingInsightAsync()
        {
            var result = await _aiInsightService.GetInsightAsync(
                EnumInsightKind.SpendingWeekly, GetUserId(), forceRefresh: true);

            return Ok(result);
        }

        [HttpGet("portfolio")]
        public async Task<IActionResult> GetPortfolioInsightAsync()
        {
            var result = await _aiInsightService.GetInsightAsync(EnumInsightKind.PortfolioSnapshot, GetUserId());

            return Ok(result);
        }

        /// Deletes every stored analysis and the snapshot each one was generated from. The
        /// next visit generates a new one, still counted against the monthly quota.
        [HttpDelete]
        public async Task<IActionResult> DeleteInsightsAsync()
        {
            var deleted = await _aiInsightService.DeleteInsightsAsync(GetUserId());

            return Ok(new { deleted });
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

        /// The "IA no Quantia" profile card: the user's switch, usage and what is stored.
        [HttpGet("settings")]
        public async Task<IActionResult> GetSettingsAsync()
        {
            var settings = await _aiInsightService.GetSettingsAsync(GetUserId());

            return settings is null ? NotFound(new { error = "User not found." }) : Ok(settings);
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettingsAsync([FromBody] UpdateAiSettingsRequestDto requestDto)
        {
            var settings = await _aiInsightService.UpdateSettingsAsync(requestDto, GetUserId());

            return settings is null ? NotFound(new { error = "User not found." }) : Ok(settings);
        }
    }
}
