using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Pluggy;
using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FinanceControl.WebApi.Filters;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FinanceControl.WebApi.Controllers
{
    /// <summary>
    /// Bank connections through Open Finance (Pluggy). Failures answer
    /// <c>{ error: CODE }</c> with a code from OpenFinanceErrors.
    /// </summary>
    [Route("api/open-finance")]
    [ApiController]
    [Authorize]
    public class OpenFinanceController : BaseController
    {
        private readonly IOpenFinanceService _openFinanceService;
        private readonly IValidator<CreateConnectTokenRequestDto> _connectTokenValidator;
        private readonly IValidator<RegisterBankConnectionRequestDto> _registerValidator;
        private readonly IValidator<LinkBankAccountsRequestDto> _linkValidator;
        private readonly IValidator<AdjustBankBalanceRequestDto> _adjustValidator;

        public OpenFinanceController(
            IOpenFinanceService openFinanceService,
            IValidator<CreateConnectTokenRequestDto> connectTokenValidator,
            IValidator<RegisterBankConnectionRequestDto> registerValidator,
            IValidator<LinkBankAccountsRequestDto> linkValidator,
            IValidator<AdjustBankBalanceRequestDto> adjustValidator)
        {
            _openFinanceService = openFinanceService;
            _connectTokenValidator = connectTokenValidator;
            _registerValidator = registerValidator;
            _linkValidator = linkValidator;
            _adjustValidator = adjustValidator;
        }

        /// <summary>Whether the feature is on and the user may use it. Reachable without a subscription.</summary>
        [HttpGet("status")]
        [SkipSubscriptionCheck]
        public async Task<IActionResult> GetStatusAsync(CancellationToken cancellationToken) =>
            Ok(await _openFinanceService.GetStatusAsync(GetUserId(), cancellationToken));

        [HttpGet("connectors")]
        public async Task<IActionResult> GetConnectorsAsync(CancellationToken cancellationToken)
        {
            var result = await _openFinanceService.GetConnectorsAsync(GetUserId(), cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        /// <summary>A 30-minute token for the Pluggy widget; with a connection id, to reconnect it.</summary>
        [HttpPost("connect-token")]
        [EnableRateLimiting("openFinance")]
        public async Task<IActionResult> CreateConnectTokenAsync(
            [FromBody] CreateConnectTokenRequestDto requestDto, CancellationToken cancellationToken)
        {
            var validationResult = _connectTokenValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _openFinanceService.CreateConnectTokenAsync(GetUserId(), requestDto, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        [HttpGet("connections")]
        public async Task<IActionResult> GetConnectionsAsync(CancellationToken cancellationToken) =>
            Ok(await _openFinanceService.GetConnectionsAsync(GetUserId(), cancellationToken));

        /// <summary>Registers the item the widget returned on success.</summary>
        [HttpPost("connections")]
        [EnableRateLimiting("openFinance")]
        public async Task<IActionResult> RegisterConnectionAsync(
            [FromBody] RegisterBankConnectionRequestDto requestDto, CancellationToken cancellationToken)
        {
            var validationResult = _registerValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _openFinanceService.RegisterConnectionAsync(GetUserId(), requestDto, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        [HttpGet("connections/{id}")]
        public async Task<IActionResult> GetConnectionAsync(int id, CancellationToken cancellationToken)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var result = await _openFinanceService.GetConnectionAsync(GetUserId(), id, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        [HttpPut("connections/{id}/accounts")]
        public async Task<IActionResult> LinkAccountsAsync(
            int id, [FromBody] LinkBankAccountsRequestDto requestDto, CancellationToken cancellationToken)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var validationResult = _linkValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _openFinanceService.LinkAccountsAsync(GetUserId(), id, requestDto, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        /// <summary>Asks the bank for fresh data now; the result arrives by webhook.</summary>
        [HttpPost("connections/{id}/sync")]
        [EnableRateLimiting("openFinance")]
        public async Task<IActionResult> SyncNowAsync(int id, CancellationToken cancellationToken)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var result = await _openFinanceService.SyncNowAsync(GetUserId(), id, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        [HttpPost("connections/{id}/balance-adjustment")]
        public async Task<IActionResult> AdjustBalanceAsync(
            int id, [FromBody] AdjustBankBalanceRequestDto requestDto, CancellationToken cancellationToken)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var validationResult = _adjustValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _openFinanceService.AdjustBalanceAsync(GetUserId(), id, requestDto, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        /// <summary>
        /// Disconnects the bank (revoking the consent at Pluggy). Reachable without a
        /// subscription: removing access to one's bank data must always be possible.
        /// </summary>
        [HttpDelete("connections/{id}")]
        [SkipSubscriptionCheck]
        public async Task<IActionResult> DisconnectAsync(
            int id, [FromQuery] bool deleteTransactions, CancellationToken cancellationToken)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var result = await _openFinanceService.DisconnectAsync(GetUserId(), id, deleteTransactions, cancellationToken);
            return result.IsFailure ? ToError(result.Error!) : Ok(result.Value);
        }

        private IActionResult ToError(string code) => code switch
        {
            OpenFinanceErrors.Unavailable
                or OpenFinanceErrors.ConnectionNotFound
                or OpenFinanceErrors.BankAccountNotFound
                or OpenFinanceErrors.AccountNotFound => NotFound(new { error = code }),
            OpenFinanceErrors.SubscriptionRequired => StatusCode(StatusCodes.Status403Forbidden, new { error = code }),
            OpenFinanceErrors.ConnectionLimitReached
                or OpenFinanceErrors.AlreadyLinked
                or OpenFinanceErrors.AccountAlreadyLinked
                or OpenFinanceErrors.ReconnectRequired => Conflict(new { error = code }),
            OpenFinanceErrors.SyncCooldown => StatusCode(StatusCodes.Status429TooManyRequests, new { error = code }),
            OpenFinanceErrors.ProviderUnavailable => StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = code }),
            OpenFinanceErrors.ProviderRejected => StatusCode(StatusCodes.Status502BadGateway, new { error = code }),
            _ => BadRequest(new { error = code })
        };
    }
}
