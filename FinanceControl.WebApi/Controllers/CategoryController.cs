using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Models;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoryController : BaseController
    {
        private readonly ICategoryService _categoryService;
        private readonly IValidator<CreateCategoryRequestDto> _createCategoryValidator;
        private readonly IValidator<UpdateCategoriesRequestDto> _updateCategoriesValidator;
        public CategoryController(ICategoryService categoryService, IValidator<CreateCategoryRequestDto> createCategoryValidator, IValidator<UpdateCategoriesRequestDto> updateCategoriesValidator)
        {
            _categoryService = categoryService;
            _createCategoryValidator = createCategoryValidator;
            _updateCategoriesValidator = updateCategoriesValidator;
        }

        
        [HttpPost]
        public async Task<IActionResult> CreateCategoryAsync([FromBody]CreateCategoryRequestDto requestDto)
        {
            var validationResult = _createCategoryValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _categoryService.CreateCategoryAsync(requestDto, userId);

            return Created($"/api/category", result.Value);
        }


        [HttpGet]
        public async Task<IActionResult> GetAllCategoriesAsync()
        {
            var userId = GetUserId();

            var result = await _categoryService.GetAllCategoriesAsync(userId);
            return Ok(result);
        }

        
        [HttpPatch]
        public async Task<IActionResult> UpdateCategoriesAsync([FromBody] UpdateCategoriesRequestDto requestDto)
        {
            var validationResult = _updateCategoriesValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _categoryService.UpdateCategoriesAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCategoryByIdAsync([FromRoute]int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _categoryService.DeleteCategoryByIdAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
