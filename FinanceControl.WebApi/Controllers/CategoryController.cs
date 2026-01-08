using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Models;
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
        private readonly IValidator<UpdateCategoryRequestDto> _updateCategoryValidator;
        public CategoryController(ICategoryService categoryService, IValidator<CreateCategoryRequestDto> createCategoryValidator ,IValidator<UpdateCategoryRequestDto> updateCategoryValidator)
        {
            _categoryService = categoryService;
            _createCategoryValidator = createCategoryValidator;
            _updateCategoryValidator = updateCategoryValidator;
        }

        
        [HttpPost]
        public async Task<IActionResult> CreateCategoryAsync([FromBody]CreateCategoryRequestDto requestDto)
        {
            var validatorResult = _createCategoryValidator.Validate(requestDto);
            if (validatorResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _categoryService.CreateCategoryAsync(requestDto, userId);

            return Created($"/api/categories/{result.Value!.Id}", result.Value);

        }

        
        [HttpGet]
        public async Task<IActionResult> GetAllCategoriesAsync()
        {
            var userId = GetUserId();
            var result = await _categoryService.GetCategoriesAsync(userId);
            return Ok(result);
        }

        
        [HttpPatch("by-id")]
        public async Task<IActionResult> UpdateCategoryByIdAsync([FromBody] UpdateCategoryRequestDto requestDto)
        {
            var validatorResult = _updateCategoryValidator.Validate(requestDto);
            if (validatorResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _categoryService.UpdateCategoryByIdAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCategoryByIdAsync([FromRoute]int id)
        {
            var userId = GetUserId();
            var result = await _categoryService.DeleteCategoryByIdAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
