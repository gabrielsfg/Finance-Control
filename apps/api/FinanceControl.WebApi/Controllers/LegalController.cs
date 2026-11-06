using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FinanceControl.WebApi.Filters;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    /// <summary>
    /// Reading the documents is anonymous; the re-acceptance endpoints need a user but no
    /// subscription — someone whose plan lapsed must still be able to accept new terms.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [SkipSubscriptionCheck]
    public class LegalController : BaseController
    {
        private readonly ILegalService _legalService;
        private readonly IValidator<AcceptLegalDocumentsRequestDto> _acceptValidator;

        public LegalController(ILegalService legalService, IValidator<AcceptLegalDocumentsRequestDto> acceptValidator)
        {
            _legalService = legalService;
            _acceptValidator = acceptValidator;
        }

        /// <summary>
        /// The documents whose current version this user has not accepted yet. The
        /// clients block the app while this is not empty.
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingAsync()
        {
            var pending = await _legalService.GetPendingDocumentsAsync(GetUserId());
            return Ok(pending);
        }

        /// <summary>
        /// Accepts the pending documents, recording the same evidence as registration
        /// (time, version, address, user agent). Returns what is still pending.
        /// </summary>
        [HttpPost("accept")]
        public async Task<IActionResult> AcceptAsync([FromBody] AcceptLegalDocumentsRequestDto requestDto)
        {
            var validationResult = _acceptValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _legalService.AcceptPendingDocumentsAsync(
                GetUserId(), requestDto, GetClientIpAddress(), GetUserAgent());
            if (result.IsFailure)
                return Conflict(new { error = result.Error });

            return Ok(result.Value);
        }

        /// <summary>
        /// Anonymous on purpose: these pages are linked from the registration form, so
        /// they have to be readable before an account exists.
        /// </summary>
        [HttpGet("{type}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDocumentAsync(EnumLegalDocumentType type, [FromQuery] int? version)
        {
            if (version is <= 0)
                return BadRequest(new { error = "Version must be a positive number." });

            var document = await _legalService.GetDocumentAsync(type, version);
            if (document is null)
                return NotFound();

            return Ok(document);
        }

        /// <summary>Every published version of a document, newest first — the archive behind "previous versions".</summary>
        [HttpGet("{type}/versions")]
        [AllowAnonymous]
        public async Task<IActionResult> GetVersionsAsync(EnumLegalDocumentType type)
        {
            var versions = await _legalService.GetVersionsAsync(type);
            return Ok(versions);
        }
    }
}
