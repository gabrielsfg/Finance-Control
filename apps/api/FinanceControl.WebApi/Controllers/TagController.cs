using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Services;
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
        private readonly IValidator<UpdateTagRequestDto> _updateTagValidator;

        public TagController(
            ITagService tagService,
            IValidator<CreateTagRequestDto> createTagValidator,
            IValidator<UpdateTagRequestDto> updateTagValidator)
        {
            _tagService = tagService;
            _createTagValidator = createTagValidator;
            _updateTagValidator = updateTagValidator;
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

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTagAsync([FromRoute] int id, [FromBody] UpdateTagRequestDto requestDto)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var validationResult = _updateTagValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _tagService.UpdateTagAsync(id, requestDto, userId);

            if (result.IsFailure)
            {
                if (result.Error == "Tag not found.")
                    return NotFound(new { error = result.Error });

                // A name clash is answered separately so the caller can offer to merge
                // rather than showing the user a dead end.
                if (result.Error == TagService.TagNameTakenError)
                    return Conflict(new { error = result.Error });

                return BadRequest(new { error = result.Error });
            }

            return Ok(result.Value);
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
