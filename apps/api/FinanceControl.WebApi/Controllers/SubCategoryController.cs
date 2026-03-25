using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
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
            var validationResult = _createSubCategoryValidator.Validate(requestDto);
            if(validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _subCategoryService.CreateSubCategoryAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Created($"/api/subcategory", result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSubCategoryAsync()
        {
            var userId = GetUserId();

            var result = await _subCategoryService.GetAllSubCategoryAsync(userId);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetSubCategoryByIdAsync([FromRoute]int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();

            var result = await _subCategoryService.GetSubCategoryByIdAsync(id, userId);

            if (result == null)
                return NotFound(new { error = "SubCategory not found." });

            return Ok(result);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateSubCategoryAsync([FromRoute] int id, [FromBody]UpdateSubCategoryRequestDto requestDto)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var validationResult = _updateSubCategoryValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            requestDto.Id = id;
            var userId = GetUserId();

            var result = await _subCategoryService.UpdateSubCategoryAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSubCategoryAsync([FromRoute] int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _subCategoryService.DeleteSubCategoryAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
