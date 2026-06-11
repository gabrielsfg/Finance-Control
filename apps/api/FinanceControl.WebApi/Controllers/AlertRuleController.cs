using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AlertRuleController : BaseController
    {
        private readonly IAlertRuleService _alertRuleService;
        private readonly IValidator<CreateAlertRuleRequestDto> _createValidator;

        public AlertRuleController(
            IAlertRuleService alertRuleService,
            IValidator<CreateAlertRuleRequestDto> createValidator)
        {
            _alertRuleService = alertRuleService;
            _createValidator = createValidator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync()
        {
            var userId = GetUserId();
            var result = await _alertRuleService.GetAllAsync(userId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateAlertRuleRequestDto requestDto)
        {
            var validationResult = _createValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _alertRuleService.CreateAsync(requestDto, userId);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync([FromRoute] int id)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var userId = GetUserId();
            var result = await _alertRuleService.DeleteAsync(id, userId);
            return Ok(result);
        }
    }
}
