using FinanceControl.Services.Mcp;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    /// The consent page of the MCP connector. The web app calls these with the user's
    /// normal session: the user must be logged in to the app to authorise an AI, and the
    /// grant is created for exactly that user.
    [Route("api/oauth/requests")]
    [ApiController]
    [Authorize]
    public class OAuthConsentController : BaseController
    {
        private readonly McpOAuthService _oauthService;

        public OAuthConsentController(McpOAuthService oauthService)
        {
            _oauthService = oauthService;
        }

        [HttpGet("{requestId}")]
        public async Task<IActionResult> GetRequestAsync(string requestId)
        {
            var result = await _oauthService.GetAuthorizationRequestAsync(requestId);
            if (result.IsFailure)
                return StatusCode(StatusCodes.Status410Gone, new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPost("{requestId}/approve")]
        public async Task<IActionResult> ApproveAsync(string requestId, [FromBody] ApproveMcpAuthorizationRequestDto? requestDto)
        {
            var result = await _oauthService.ApproveAsync(requestId, requestDto ?? new ApproveMcpAuthorizationRequestDto(), GetUserId());
            if (result.IsFailure)
                return StatusCode(StatusCodes.Status410Gone, new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPost("{requestId}/deny")]
        public async Task<IActionResult> DenyAsync(string requestId)
        {
            var result = await _oauthService.DenyAsync(requestId, GetUserId());
            if (result.IsFailure)
                return StatusCode(StatusCodes.Status410Gone, new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
