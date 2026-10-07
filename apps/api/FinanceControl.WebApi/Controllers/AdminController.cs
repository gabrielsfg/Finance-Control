using FinanceControl.WebApi.Filters;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Brapi;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [SkipSubscriptionCheck]
    public class AdminController : BaseController
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ISubscriptionService _subscriptionService;
        private readonly AdminSettings _adminSettings;
        private readonly IValidator<GrantComplimentarySubscriptionRequestDto> _grantSubscriptionValidator;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            BrapiPriceUpdateJobService jobService,
            ISubscriptionService subscriptionService,
            IOptions<AdminSettings> adminSettings,
            IValidator<GrantComplimentarySubscriptionRequestDto> grantSubscriptionValidator,
            ILogger<AdminController> logger)
        {
            _jobService = jobService;
            _subscriptionService = subscriptionService;
            _adminSettings = adminSettings.Value;
            _grantSubscriptionValidator = grantSubscriptionValidator;
            _logger = logger;
        }

        /// <summary>
        /// Triggers the Brapi price update job immediately.
        /// Use this to manually populate historical price data without waiting for the scheduled run.
        /// </summary>
        [HttpPost("brapi-job/run")]
        public IActionResult RunBrapiJob(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Manual Brapi job trigger by user {UserId}.", GetUserId());

            // Fire-and-forget — the job can take several minutes on first run (backfill)
            _ = _jobService.RunAsync(cancellationToken);

            return Accepted(new
            {
                message = "Job iniciado em background. Acompanhe os logs da API para o progresso.",
                hint    = "Chame GET /api/admin/brapi-job/status para ver o resultado do último run.",
            });
        }

        /// <summary>
        /// Returns the status of the last Brapi job run.
        /// </summary>
        [HttpGet("brapi-job/status")]
        public IActionResult GetBrapiJobStatus()
        {
            return Ok(_jobService.LastStatus);
        }

        /// <summary>
        /// Gives an account a complimentary subscription (no gateway, no charges) for a
        /// number of months — for testing the paid features and for courtesy accounts.
        /// </summary>
        /// <remarks>
        /// Gated by AdminSettings because it hands out a paid plan and there is no role
        /// system to lean on — an unconfigured list denies everyone.
        /// </remarks>
        [HttpPut("user/{id:int}/subscription")]
        public async Task<IActionResult> GrantSubscriptionAsync(
            int id,
            [FromBody] GrantComplimentarySubscriptionRequestDto requestDto)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var validationResult = _grantSubscriptionValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var callerId = GetUserId();
            if (!_adminSettings.IsAdmin(callerId))
            {
                _logger.LogWarning("User {UserId} attempted to grant a subscription to user {TargetId}.", callerId, id);
                return Forbid();
            }

            var result = await _subscriptionService.GrantComplimentaryAsync(requestDto, id);
            if (result.IsFailure)
                return result.Error == BillingErrors.UserNotFound
                    ? NotFound(new { error = result.Error })
                    : Conflict(new { error = result.Error });

            _logger.LogInformation(
                "User {UserId} granted {Plan} for {Months} month(s) to user {TargetId}.",
                callerId, requestDto.Plan, requestDto.Months, id);

            return Ok(result.Value);
        }
    }
}
