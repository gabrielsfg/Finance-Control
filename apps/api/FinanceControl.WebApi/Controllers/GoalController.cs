using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.WebApi.Controllers.Base;
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

        public GoalController(IGoalService goalService)
        {
            _goalService = goalService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateGoalRequestDto dto)
        {
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
            var result = await _goalService.UpdateAsync(GetUserId(), id, dto);
            if (result.IsFailure) return NotFound();
            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync([FromRoute] int id, [FromQuery] int? returnToAccountId)
        {
            var result = await _goalService.DeleteAsync(GetUserId(), id, returnToAccountId);
            if (result.IsFailure)
            {
                if (result.Error!.Contains("balance"))
                    return UnprocessableEntity(new { message = result.Error });
                return NotFound();
            }
            return NoContent();
        }

        [HttpPost("{id:int}/contribute")]
        public async Task<IActionResult> RecordContributionAsync([FromRoute] int id, [FromBody] RecordGoalContributionRequestDto dto)
        {
            var result = await _goalService.RecordContributionAsync(GetUserId(), id, dto);
            if (result.IsFailure) return result.Error!.Contains("not found") ? NotFound() : UnprocessableEntity(new { message = result.Error });
            return Ok(result.Value);
        }

        [HttpPost("{id:int}/withdraw")]
        public async Task<IActionResult> WithdrawAsync([FromRoute] int id, [FromBody] WithdrawGoalRequestDto dto)
        {
            var result = await _goalService.WithdrawAsync(GetUserId(), id, dto);
            if (result.IsFailure) return result.Error!.Contains("not found") ? NotFound() : UnprocessableEntity(new { message = result.Error });
            return Ok(result.Value);
        }

        [HttpPost("{id:int}/purchase")]
        public async Task<IActionResult> RegisterPurchaseAsync([FromRoute] int id, [FromBody] RegisterGoalPurchaseRequestDto dto)
        {
            var result = await _goalService.RegisterPurchaseAsync(GetUserId(), id, dto);
            if (result.IsFailure) return result.Error!.Contains("not found") ? NotFound() : UnprocessableEntity(new { message = result.Error });
            return Ok(result.Value);
        }
    }
}
