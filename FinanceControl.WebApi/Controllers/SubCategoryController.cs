using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubCategoryController : BaseController
    {
        private readonly ISubCategoryService _subCategoryService;
        private readonly IValidator<CreateSubCategoryRequestDto> _createSubCategoryValidator;
        private readonly IValidator<UpdateSubCategoryRequestDto> _updateSubCategoryValidator;
        public SubCategoryController(
            ISubCategoryService subCategoryService, 
            IValidator<UpdateSubCategoryRequestDto> updateSubCategoryValidator, 
            IValidator<CreateSubCategoryRequestDto> createSubCategoryValidator)
        {
            _subCategoryService = subCategoryService;
            _updateSubCategoryValidator = updateSubCategoryValidator;
            _createSubCategoryValidator = createSubCategoryValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSubCategoryAsync([FromBody] CreateSubCategoryRequestDto requestDto)
        {
            var validatorResult = _createSubCategoryValidator.Validate(requestDto);
            if(validatorResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _subCategoryService.CreateSubCategoryAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllSubCategoryAsync()
        {
            var userId = GetUserId();

            var result = await _subCategoryService.GetAllSubCategoryAsync(userId);
            return Ok(result);
        }

        [HttpGet("by-id/{id:int}")]
        public async Task<IActionResult> GetSubCategoryByIdAsync([FromRoute]int id)
        {
            var userId = GetUserId();

            var result = await _subCategoryService.GetSubCategoryByIdAsync(id, userId);

            if (result == null)
                return NotFound("SubCategory not found.");

            return Ok(result);
        }

        [HttpPatch]
        public async Task<IActionResult> UpdateSubCategoryAsync([FromBody]UpdateSubCategoryRequestDto requestDto)
        {
            var validatorResult = _updateSubCategoryValidator.Validate(requestDto);
            if (validatorResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _subCategoryService.UpdateSubCategoryAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSubCategoryAsync([FromRoute] int id)
        {
            var userId = GetUserId();
            var result = await _subCategoryService.DeleteSubCategoryAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
