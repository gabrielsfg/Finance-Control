using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceControl.WebApi.Controllers.Base
{
    [ApiController]
    public class BaseController : ControllerBase
    {
        protected int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("userId");

            return int.Parse(claim!.Value);
        }

        /// <summary>
        /// Caller address as seen after UseForwardedHeaders has folded X-Forwarded-For in,
        /// so behind the reverse proxy this is the real client and not the proxy.
        /// </summary>
        protected string? GetClientIpAddress() =>
            HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>Truncated to what the column holds — a header is attacker-controlled and unbounded.</summary>
        protected string? GetUserAgent()
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            if (string.IsNullOrWhiteSpace(userAgent))
                return null;

            return userAgent.Length > 512 ? userAgent[..512] : userAgent;
        }
    }
}
