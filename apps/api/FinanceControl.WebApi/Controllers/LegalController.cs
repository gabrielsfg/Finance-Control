using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Enums;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class LegalController : BaseController
    {
        private readonly ILegalService _legalService;

        public LegalController(ILegalService legalService)
        {
            _legalService = legalService;
        }

        /// <summary>
        /// Anonymous on purpose: these pages are linked from the registration form, so
        /// they have to be readable before an account exists.
        /// </summary>
        [HttpGet("{type}")]
        public async Task<IActionResult> GetDocumentAsync(EnumLegalDocumentType type, [FromQuery] int? version)
        {
            if (version is <= 0)
                return BadRequest(new { error = "Version must be a positive number." });

            var document = await _legalService.GetDocumentAsync(type, version);
            if (document is null)
                return NotFound();

            return Ok(document);
        }
    }
}
