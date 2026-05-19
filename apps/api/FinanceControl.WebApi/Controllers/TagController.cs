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
    public class TagController : BaseController
    {
        private readonly ITagService _tagService;
        private readonly IValidator<CreateTagRequestDto> _createTagValidator;

        public TagController(ITagService tagService, IValidator<CreateTagRequestDto> createTagValidator)
        {
            _tagService = tagService;
            _createTagValidator = createTagValidator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTagsAsync()
        {
            var userId = GetUserId();
            var result = await _tagService.GetAllTagsAsync(userId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTagAsync([FromBody] CreateTagRequestDto requestDto)
        {
            var validationResult = _createTagValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _tagService.CreateTagAsync(requestDto, userId);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Created($"/api/tag/{result.Value.Id}", result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTagAsync([FromRoute] int id)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var userId = GetUserId();
            var result = await _tagService.DeleteTagAsync(id, userId);
            if (result.IsFailure)
                return result.Error == "Tag not found."
                    ? NotFound(new { error = result.Error })
                    : BadRequest(new { error = result.Error });

            return NoContent();
        }
    }
}
