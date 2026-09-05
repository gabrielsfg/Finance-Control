using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    /// Write-only on purpose: reports are read straight from the database during
    /// triage. There is no listing endpoint because there is no admin role to
    /// gate one with — an authenticated GET here would hand every user everyone
    /// else's reports.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FeedbackController : BaseController
    {
        private readonly IFeedbackService _feedbackService;
        private readonly IValidator<CreateFeedbackRequestDto> _createFeedbackValidator;

        public FeedbackController(
            IFeedbackService feedbackService,
            IValidator<CreateFeedbackRequestDto> createFeedbackValidator)
        {
            _feedbackService = feedbackService;
            _createFeedbackValidator = createFeedbackValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateFeedbackAsync(
            [FromBody] CreateFeedbackRequestDto requestDto)
        {
            var validationResult = _createFeedbackValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _feedbackService.CreateFeedbackAsync(requestDto, userId);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Created($"/api/feedback/{result.Value!.Id}", result.Value);
        }
    }
}
