using System.Security.Claims;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Billing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Filters
{
    /// <summary>
    /// The paywall: an authenticated user without access gets 403 with the code
    /// <c>SUBSCRIPTION_REQUIRED</c> on every endpoint not marked
    /// <see cref="SkipSubscriptionCheckAttribute"/>. The data stays; only the app is closed.
    /// </summary>
    /// <remarks>
    /// Registered globally, so a new controller is behind the paywall by default — the
    /// failure mode of forgetting an attribute is "locked", never "free".
    /// </remarks>
    public class SubscriptionAccessFilter : IAsyncActionFilter
    {
        public const string ErrorCode = "SUBSCRIPTION_REQUIRED";

        private readonly ISubscriptionAccessService _accessService;
        private readonly BillingSettings _settings;

        public SubscriptionAccessFilter(ISubscriptionAccessService accessService, IOptions<BillingSettings> settings)
        {
            _accessService = accessService;
            _settings = settings.Value;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (!_settings.EnforceAccess || IsExempt(context))
            {
                await next();
                return;
            }

            var claim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                ?? context.HttpContext.User.FindFirst("userId");
            if (claim is null || !int.TryParse(claim.Value, out var userId))
            {
                // Not authenticated: [Authorize] answers 401 on its own.
                await next();
                return;
            }

            var access = await _accessService.GetAccessAsync(userId, context.HttpContext.RequestAborted);
            if (!access.HasAccess)
            {
                context.Result = new ObjectResult(new { error = ErrorCode }) { StatusCode = StatusCodes.Status403Forbidden };
                return;
            }

            await next();
        }

        private static bool IsExempt(ActionExecutingContext context) =>
            context.ActionDescriptor.EndpointMetadata.Any(m => m is SkipSubscriptionCheckAttribute or AllowAnonymousAttribute);
    }
}
