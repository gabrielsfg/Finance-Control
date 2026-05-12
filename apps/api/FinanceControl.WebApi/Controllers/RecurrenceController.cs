using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/recurrences")]
    [ApiController]
    [Authorize]
    public class RecurrenceController : BaseController
    {
        private readonly IRecurrencePageService _service;
        private readonly IValidator<CreateRecurringTransactionRequestDto> _createValidator;
        private readonly IValidator<UpdateRecurringTransactionRequestDto> _updateValidator;

        public RecurrenceController(
            IRecurrencePageService service,
            IValidator<CreateRecurringTransactionRequestDto> createValidator,
            IValidator<UpdateRecurringTransactionRequestDto> updateValidator)
        {
            _service         = service;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>GET /api/recurrences — retorna recorrentes, parcelamentos e totalizadores numa única resposta</summary>
        [HttpGet]
        public async Task<IActionResult> GetPageAsync()
        {
            var result = await _service.GetPageAsync(GetUserId());
            return Ok(result);
        }

        /// <summary>POST /api/recurrences/recurring — cria recorrência e primeira transação na StartDate</summary>
        [HttpPost("recurring")]
        public async Task<IActionResult> CreateRecurringAsync([FromBody] CreateRecurringTransactionRequestDto dto)
        {
            var validation = _createValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _service.CreateRecurringAsync(GetUserId(), dto);
            return Created($"/api/recurrences/recurring/{result.Id}", result);
        }

        /// <summary>PATCH /api/recurrences/recurring/{id} — atualiza recorrência</summary>
        [HttpPatch("recurring/{id:int}")]
        public async Task<IActionResult> UpdateRecurringAsync([FromRoute] int id, [FromBody] UpdateRecurringTransactionRequestDto dto)
        {
            var validation = _updateValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _service.UpdateRecurringAsync(GetUserId(), id, dto);
            if (result.IsFailure) return NotFound(new { message = result.Error });
            return Ok(result.Value);
        }

        /// <summary>PATCH /api/recurrences/recurring/{id}/cancel — desativa recorrência</summary>
        [HttpPatch("recurring/{id:int}/cancel")]
        public async Task<IActionResult> CancelRecurringAsync([FromRoute] int id)
        {
            var result = await _service.CancelRecurringAsync(GetUserId(), id);
            if (result.IsFailure) return NotFound(new { message = result.Error });
            return NoContent();
        }

        /// <summary>DELETE /api/recurrences/recurring/{id} — remove recorrência e desvincula transações geradas</summary>
        [HttpDelete("recurring/{id:int}")]
        public async Task<IActionResult> DeleteRecurringAsync([FromRoute] int id)
        {
            var result = await _service.DeleteRecurringAsync(GetUserId(), id);
            if (result.IsFailure) return NotFound(new { message = result.Error });
            return NoContent();
        }
    }
}
