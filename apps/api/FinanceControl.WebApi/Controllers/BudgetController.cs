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
        private readonly IValidator<CreateBudgetResquestDto> _createBudgetValidator;
        private readonly IValidator<UpdateBudgetRequestDto> _updateBudgetValidator;

        public BudgetController(IBudgetService budgetService, IValidator<CreateBudgetResquestDto> createBudgetValidator, IValidator<UpdateBudgetRequestDto> updateBudgetValidator)
        {
            _budgetService = budgetService;
            _createBudgetValidator = createBudgetValidator;
            _updateBudgetValidator = updateBudgetValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBudgetAsync([FromBody] CreateBudgetResquestDto requestDto)
        {
            var validatonResult = _createBudgetValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _budgetService.CreateBudgetAsync(requestDto, userId);
            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllBudgetsAsync()
        {
            var userId = GetUserId();

            var result = await _budgetService.GetAllBudgetAsync(userId);

            return Ok(result);
        }

        [HttpGet("by-id/{id:int}")]
        public async Task<IActionResult> GetBudgetByIdAsync([FromRoute]int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _budgetService.GetBudgetByIdAsync(id, userId);

            if (result == null)
                return NotFound("Category not found.");
            return Ok(result);
        }

        [HttpPatch]
        public async Task<IActionResult> UpdateBudgetAsync([FromBody]UpdateBudgetRequestDto requestDto)
        {
            var validatonResult = _updateBudgetValidator.Validate(requestDto);

            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _budgetService.UpdateBudgetAsync(requestDto, userId);

            if(result.IsFailure)
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
