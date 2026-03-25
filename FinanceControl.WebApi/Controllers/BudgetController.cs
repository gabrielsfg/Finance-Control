using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BudgetController : BaseController
    {
        private readonly IBudgetService _budgetService;
        private readonly IValidator<CreateBudgetRequestDto> _createBudgetValidator;
        private readonly IValidator<UpdateBudgetRequestDto> _updateBudgetValidator;

        public BudgetController(IBudgetService budgetService, IValidator<CreateBudgetRequestDto> createBudgetValidator, IValidator<UpdateBudgetRequestDto> updateBudgetValidator)
        {
            _budgetService = budgetService;
            _createBudgetValidator = createBudgetValidator;
            _updateBudgetValidator = updateBudgetValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBudgetAsync([FromBody] CreateBudgetRequestDto requestDto)
        {
            var validationResult = _createBudgetValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _budgetService.CreateBudgetAsync(requestDto, userId);
            return Created($"/api/budget", result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBudgetsAsync()
        {
            var userId = GetUserId();

            var result = await _budgetService.GetAllBudgetAsync(userId);

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetBudgetByIdAsync([FromRoute]int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _budgetService.GetBudgetByIdAsync(id, userId);

            if (result == null)
                return NotFound(new { error = "Budget not found." });
            return Ok(result);
        }

        [HttpGet("{id:int}/allocation")]
        public async Task<IActionResult> GetBudgetWithAllocationsAsync([FromRoute] int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _budgetService.GetBudgetWithAllocationsAsync(id, userId);

            if (result == null)
                return NotFound(new { error = "Budget not found." });
            return Ok(result);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateBudgetAsync([FromRoute] int id, [FromBody]UpdateBudgetRequestDto requestDto)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var validationResult = _updateBudgetValidator.Validate(requestDto);

            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            requestDto.Id = id;
            var userId = GetUserId();
            var result = await _budgetService.UpdateBudgetAsync(requestDto, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteBudgetAsync([FromRoute]int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _budgetService.DeleteBudgetAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
