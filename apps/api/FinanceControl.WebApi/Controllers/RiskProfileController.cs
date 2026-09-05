using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    /// The declared investor profile. Available to every plan — answering the
    /// questionnaire costs nothing and the answers belong to the user, whether or not
    /// the analyses that read them are enabled for the account.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RiskProfileController : BaseController
    {
        private readonly IRiskProfileService _riskProfileService;
        private readonly IValidator<SaveRiskProfileRequestDto> _saveRiskProfileValidator;

        public RiskProfileController(
            IRiskProfileService riskProfileService,
            IValidator<SaveRiskProfileRequestDto> saveRiskProfileValidator)
        {
            _riskProfileService = riskProfileService;
            _saveRiskProfileValidator = saveRiskProfileValidator;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfileAsync()
        {
            var profile = await _riskProfileService.GetProfileAsync(GetUserId());

            return profile is null ? NoContent() : Ok(profile);
        }

        [HttpPut]
        public async Task<IActionResult> SaveProfileAsync([FromBody] SaveRiskProfileRequestDto requestDto)
        {
            var validationResult = _saveRiskProfileValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _riskProfileService.SaveProfileAsync(requestDto, GetUserId());
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteProfileAsync()
        {
            var result = await _riskProfileService.DeleteProfileAsync(GetUserId());

            return result.IsFailure ? NotFound(new { error = result.Error }) : NoContent();
        }
    }
}
