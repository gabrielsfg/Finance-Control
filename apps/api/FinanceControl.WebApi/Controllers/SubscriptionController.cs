using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Billing;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Models;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Filters;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FinanceControl.WebApi.Controllers
{
    /// <summary>
    /// The user's subscription. Reachable without one, by definition — this is where a
    /// user without access goes to get it. Failures answer <c>{ error: CODE }</c> with a
    /// code from BillingErrors.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [SkipSubscriptionCheck]
    public class SubscriptionController : BaseController
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly IValidator<CreateSubscriptionRequestDto> _createValidator;
        private readonly IValidator<UpdateSubscriptionCardRequestDto> _updateCardValidator;
        private readonly IValidator<ChangeSubscriptionPlanRequestDto> _changePlanValidator;

        public SubscriptionController(
            ISubscriptionService subscriptionService,
            IValidator<CreateSubscriptionRequestDto> createValidator,
            IValidator<UpdateSubscriptionCardRequestDto> updateCardValidator,
            IValidator<ChangeSubscriptionPlanRequestDto> changePlanValidator)
        {
            _subscriptionService = subscriptionService;
            _createValidator = createValidator;
            _updateCardValidator = updateCardValidator;
            _changePlanValidator = changePlanValidator;
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetPlansAsync() =>
            Ok(await _subscriptionService.GetPlansAsync(GetUserId()));

        [HttpGet]
        public async Task<IActionResult> GetSubscriptionAsync() =>
            Ok(await _subscriptionService.GetSubscriptionAsync(GetUserId()));

        /// <summary>Subscribes with a card (trial when eligible), Pix or boleto.</summary>
        [HttpPost]
        [EnableRateLimiting("billing")]
        public async Task<IActionResult> CreateSubscriptionAsync(
            [FromBody] CreateSubscriptionRequestDto requestDto, CancellationToken cancellationToken)
        {
            var validationResult = _createValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _subscriptionService.CreateSubscriptionAsync(
                requestDto, GetUserId(), GetClientIpAddress(), cancellationToken);
            return result.IsFailure ? ToError(result.Error) : Ok(result.Value);
        }

        [HttpPost("cancel")]
        public async Task<IActionResult> CancelAsync(CancellationToken cancellationToken) =>
            Unwrap(await _subscriptionService.CancelSubscriptionAsync(GetUserId(), cancellationToken));

        [HttpPost("resume")]
        public async Task<IActionResult> ResumeAsync(CancellationToken cancellationToken) =>
            Unwrap(await _subscriptionService.ResumeSubscriptionAsync(GetUserId(), cancellationToken));

        /// <summary>Right of withdrawal: refunds the first payment within the window and ends the subscription.</summary>
        [HttpPost("refund")]
        public async Task<IActionResult> RefundAsync(CancellationToken cancellationToken) =>
            Unwrap(await _subscriptionService.RequestRefundAsync(GetUserId(), cancellationToken));

        /// <summary>With <c>confirm: false</c> returns the preview only; nothing changes until <c>confirm: true</c>.</summary>
        [HttpPost("change-plan")]
        public async Task<IActionResult> ChangePlanAsync(
            [FromBody] ChangeSubscriptionPlanRequestDto requestDto, CancellationToken cancellationToken)
        {
            var validationResult = _changePlanValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _subscriptionService.ChangePlanAsync(requestDto, GetUserId(), cancellationToken);
            return result.IsFailure ? ToError(result.Error) : Ok(result.Value);
        }

        [HttpPut("card")]
        [EnableRateLimiting("billing")]
        public async Task<IActionResult> UpdateCardAsync(
            [FromBody] UpdateSubscriptionCardRequestDto requestDto, CancellationToken cancellationToken)
        {
            var validationResult = _updateCardValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            return Unwrap(await _subscriptionService.UpdateCardAsync(
                requestDto, GetUserId(), GetClientIpAddress(), cancellationToken));
        }

        /// <summary>QR code and copy-and-paste code of the open Pix charge.</summary>
        [HttpGet("pending-charge/pix")]
        public async Task<IActionResult> GetPendingPixAsync(CancellationToken cancellationToken)
        {
            var result = await _subscriptionService.GetPendingPixQrCodeAsync(GetUserId(), cancellationToken);
            return result.IsFailure ? ToError(result.Error) : Ok(result.Value);
        }

        private IActionResult Unwrap<T>(Result<T> result) =>
            result.IsFailure ? ToError(result.Error) : Ok(result.Value);

        private IActionResult ToError(string? code) => code switch
        {
            BillingErrors.AlreadySubscribed => Conflict(new { error = code }),
            BillingErrors.NoSubscription or BillingErrors.NoPendingPix or BillingErrors.UserNotFound
                => NotFound(new { error = code }),
            BillingErrors.CardAttemptsExceeded => StatusCode(StatusCodes.Status429TooManyRequests, new { error = code }),
            BillingErrors.GatewayUnavailable => StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = code }),
            _ => BadRequest(new { error = code })
        };
    }
}
