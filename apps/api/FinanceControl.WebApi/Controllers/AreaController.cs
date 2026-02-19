using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Services;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AreaController : BaseController
    {
        private readonly IAreaService _areaService;
        private readonly IValidator<CreateAreaRequestDto> _createAreaValidator;
        private readonly IValidator<UpdateAreaRequestDto> _updateAreaValidator;

        public AreaController(IAreaService areaService, IValidator<CreateAreaRequestDto> createAreaValidator, IValidator<UpdateAreaRequestDto> updateAreaValidator)
        {
            _areaService = areaService;
            _createAreaValidator = createAreaValidator;
            _updateAreaValidator = updateAreaValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAreaAsync([FromBody]CreateAreaRequestDto requestDto)
        {
            var validationResult = _createAreaValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _areaService.CreateAreaAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet("all/{budgetId:int}")]
        public async Task<IActionResult> GetAllAreaAsync([FromRoute] int budgetId)
        {
            var validationResult = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();

            var result = await _areaService.GetAllAreasAsync(budgetId, userId);
            return Ok(result);
        }

        [HttpGet("by-id/{id:int}")]
        public async Task<IActionResult> GetAreaByIdAsync([FromRoute] int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();

            var result = await _areaService.GetAreaByIdAync(id, userId);

            if (result == null)
                return NotFound("Area not found.");

            return Ok(result);
        }

        [HttpPatch]
        public async Task<IActionResult> UpdateAreaAsync([FromBody] UpdateAreaRequestDto requestDto)
        {
            var validationResult = _updateAreaValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _areaService.UpdateAreaAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAreaAsync([FromRoute] int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _areaService.DeleteAreaAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
