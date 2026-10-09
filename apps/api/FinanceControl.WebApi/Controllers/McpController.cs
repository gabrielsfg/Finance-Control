using FinanceControl.Services.Extensions;
using FinanceControl.Services.Mcp;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    /// "Conexões de IA": the connection instructions, the AIs connected through OAuth and
    /// the personal tokens. Available on every plan — the user's own AI does the work.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class McpController : BaseController
    {
        private readonly McpOAuthService _oauthService;
        private readonly IValidator<CreateMcpPersonalTokenRequestDto> _createTokenValidator;

        public McpController(
            McpOAuthService oauthService,
            IValidator<CreateMcpPersonalTokenRequestDto> createTokenValidator)
        {
            _oauthService = oauthService;
            _createTokenValidator = createTokenValidator;
        }

        [HttpGet("info")]
        public IActionResult GetInfo() => Ok(_oauthService.GetInfo());

        [HttpGet("connections")]
        public async Task<IActionResult> ListConnectionsAsync() =>
            Ok(await _oauthService.ListConnectionsAsync(GetUserId()));

        [HttpDelete("connections/{id}")]
        public async Task<IActionResult> RevokeConnectionAsync(int id)
        {
            if (this.ValidatePositiveId(id, "id") is { } invalid)
                return invalid;

            var result = await _oauthService.RevokeConnectionAsync(id, GetUserId());
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(await _oauthService.ListConnectionsAsync(GetUserId()));
        }

        [HttpGet("tokens")]
        public async Task<IActionResult> ListTokensAsync() =>
            Ok(await _oauthService.ListPersonalTokensAsync(GetUserId()));

        [HttpPost("tokens")]
        public async Task<IActionResult> CreateTokenAsync([FromBody] CreateMcpPersonalTokenRequestDto requestDto)
        {
            var validationResult = _createTokenValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var created = await _oauthService.CreatePersonalTokenAsync(requestDto, GetUserId());
            return Created("/api/mcp/tokens", created);
        }

        [HttpDelete("tokens/{id}")]
        public async Task<IActionResult> RevokeTokenAsync(int id)
        {
            if (this.ValidatePositiveId(id, "id") is { } invalid)
                return invalid;

            var result = await _oauthService.RevokePersonalTokenAsync(id, GetUserId());
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(await _oauthService.ListPersonalTokensAsync(GetUserId()));
        }
    }
}
