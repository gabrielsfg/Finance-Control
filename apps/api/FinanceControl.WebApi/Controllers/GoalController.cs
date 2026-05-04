using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/goals")]
    [ApiController]
    [Authorize]
    public class GoalController : BaseController
    {
        private readonly IGoalService _goalService;
        private readonly IValidator<CreateGoalRequestDto> _createValidator;
        private readonly IValidator<UpdateGoalRequestDto> _updateValidator;
        private readonly IValidator<RecordGoalCheckpointRequestDto> _checkpointValidator;

        public GoalController(
            IGoalService goalService,
            IValidator<CreateGoalRequestDto> createValidator,
            IValidator<UpdateGoalRequestDto> updateValidator,
            IValidator<RecordGoalCheckpointRequestDto> checkpointValidator)
        {
            _goalService          = goalService;
            _createValidator      = createValidator;
            _updateValidator      = updateValidator;
            _checkpointValidator  = checkpointValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateGoalRequestDto dto)
        {
            var validation = _createValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _goalService.CreateAsync(GetUserId(), dto);
            return Created($"/api/goals/{result.Id}", result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync(
            [FromQuery] EnumGoalType? type,
            [FromQuery] EnumGoalStatus? status)
        {
            var items = await _goalService.GetAllAsync(GetUserId(), type, status);
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync([FromRoute] int id)
        {
            var item = await _goalService.GetByIdAsync(GetUserId(), id);
            if (item is null) return NotFound();
            return Ok(item);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateAsync([FromRoute] int id, [FromBody] UpdateGoalRequestDto dto)
        {
            var validation = _updateValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _goalService.UpdateAsync(GetUserId(), id, dto);
            if (result.IsFailure) return NotFound();
            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync([FromRoute] int id)
        {
            var result = await _goalService.DeleteAsync(GetUserId(), id);
            if (result.IsFailure) return NotFound();
            return NoContent();
        }

        [HttpPost("{id:int}/checkpoint")]
        public async Task<IActionResult> RecordCheckpointAsync([FromRoute] int id, [FromBody] RecordGoalCheckpointRequestDto dto)
        {
            var validation = _checkpointValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _goalService.RecordCheckpointAsync(GetUserId(), id, dto.Amount);
            if (result.IsFailure) return NotFound();
            return Created($"/api/goals/{id}/checkpoints", result.Value);
        }

        [HttpPost("{id:int}/achieve")]
        public async Task<IActionResult> AchieveAsync([FromRoute] int id)
        {
            var result = await _goalService.AchieveAsync(GetUserId(), id);

            if (result.IsFailure)
            {
                if (result.Error == "conflict")
                    return Conflict(new { message = "Goal is not in Active status." });
                return NotFound();
            }

            return Ok(result.Value);
        }
    }
}
