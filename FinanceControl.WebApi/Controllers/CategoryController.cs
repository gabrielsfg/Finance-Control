using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : BaseController
    {
        private readonly ICategoryService _categoryService;
        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateCategoryAsync([FromBody]CreateCategoryRequestDto requestDto)
        {
            if (requestDto == null)
                return BadRequest();

            var userId = GetUserId();

            var result = await _categoryService.CreateCategoryAsync(requestDto, userId);

            return Created($"/api/categories/{result.Value!.Id}", result.Value);

        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllCategoriesAsync()
        {
            var userId = GetUserId();
            var result = await _categoryService.GetCategoriesAsync(userId);
            return Ok(result);
        }

        [Authorize]
        [HttpPatch("by-id")]
        public async Task<IActionResult> PatchCategoryByIdAsync([FromBody] PatchCategoryRequestDto requestDto)
        {
            var userId = GetUserId();
            var result = await _categoryService.PatchCategoryByIdAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [Authorize]
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
