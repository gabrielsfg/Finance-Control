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
    /// The in-app chat assistant. Sending a message answers 200 with a status: a Free
    /// account, the AI switched off or the monthly limit reached are normal states the
    /// client renders, not errors.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AssistantController : BaseController
    {
        private readonly IAssistantService _assistantService;
        private readonly IValidator<SendAssistantMessageRequestDto> _sendMessageValidator;

        public AssistantController(
            IAssistantService assistantService,
            IValidator<SendAssistantMessageRequestDto> sendMessageValidator)
        {
            _assistantService = assistantService;
            _sendMessageValidator = sendMessageValidator;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> ListConversationsAsync()
        {
            var conversations = await _assistantService.ListConversationsAsync(GetUserId());

            return Ok(conversations);
        }

        [HttpGet("conversations/{id}")]
        public async Task<IActionResult> GetConversationAsync(int id)
        {
            if (this.ValidatePositiveId(id, "id") is { } invalid)
                return invalid;

            var conversation = await _assistantService.GetConversationAsync(id, GetUserId());

            return conversation is null ? NotFound(new { error = "Conversation not found." }) : Ok(conversation);
        }

        [HttpDelete("conversations/{id}")]
        public async Task<IActionResult> DeleteConversationAsync(int id)
        {
            if (this.ValidatePositiveId(id, "id") is { } invalid)
                return invalid;

            var result = await _assistantService.DeleteConversationAsync(id, GetUserId());
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(await _assistantService.ListConversationsAsync(GetUserId()));
        }

        /// Deletes the whole chat history of the user — the "Apagar conversas" button.
        [HttpDelete("conversations")]
        public async Task<IActionResult> DeleteAllConversationsAsync()
        {
            var deleted = await _assistantService.DeleteAllConversationsAsync(GetUserId());

            return Ok(new { deleted });
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SendMessageAsync(
            [FromBody] SendAssistantMessageRequestDto requestDto,
            CancellationToken cancellationToken)
        {
            var validationResult = _sendMessageValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _assistantService.SendMessageAsync(requestDto, GetUserId(), cancellationToken);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        /// Runs a proposal the assistant prepared. The body may carry the user's edits;
        /// either way the regular validators run before anything is written.
        [HttpPost("actions/{id}/confirm")]
        public async Task<IActionResult> ConfirmActionAsync(int id, [FromBody] ConfirmAiActionRequestDto? requestDto)
        {
            if (this.ValidatePositiveId(id, "id") is { } invalid)
                return invalid;

            var result = await _assistantService.ConfirmActionAsync(id, requestDto ?? new ConfirmAiActionRequestDto(), GetUserId());
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPost("actions/{id}/cancel")]
        public async Task<IActionResult> CancelActionAsync(int id)
        {
            if (this.ValidatePositiveId(id, "id") is { } invalid)
                return invalid;

            var result = await _assistantService.CancelActionAsync(id, GetUserId());
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
