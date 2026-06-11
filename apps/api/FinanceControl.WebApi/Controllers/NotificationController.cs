using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
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
    public class NotificationController : BaseController
    {
        private readonly INotificationService _notificationService;
        private readonly IValidator<UpdateNotificationPreferenceRequestDto> _updatePreferenceValidator;

        public NotificationController(
            INotificationService notificationService,
            IValidator<UpdateNotificationPreferenceRequestDto> updatePreferenceValidator)
        {
            _notificationService = notificationService;
            _updatePreferenceValidator = updatePreferenceValidator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync()
        {
            var userId = GetUserId();
            var result = await _notificationService.GetAllAsync(userId);
            return Ok(result);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCountAsync()
        {
            var userId = GetUserId();
            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new UnreadNotificationCountResponseDto { Count = count });
        }

        [HttpPatch("{id:int}/read")]
        public async Task<IActionResult> MarkAsReadAsync([FromRoute] int id)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var userId = GetUserId();
            var result = await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(result);
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsReadAsync()
        {
            var userId = GetUserId();
            var result = await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(result);
        }

        [HttpGet("preferences")]
        public async Task<IActionResult> GetPreferencesAsync()
        {
            var userId = GetUserId();
            var result = await _notificationService.GetPreferencesAsync(userId);
            return Ok(result);
        }

        [HttpPatch("preferences")]
        public async Task<IActionResult> UpdatePreferencesAsync(
            [FromBody] UpdateNotificationPreferenceRequestDto requestDto)
        {
            var validationResult = _updatePreferenceValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _notificationService.UpdatePreferencesAsync(requestDto, userId);
            return Ok(result);
        }
    }
}
