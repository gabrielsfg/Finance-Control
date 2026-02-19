using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/budgets/{budgetId:int}/allocation")]
    [ApiController]
    [Authorize]
    public class BudgetSubCategoryAllocationController : BaseController
    {
        private readonly IBudgetSubCategoryAllocationService _budgetSubCategoryAllocationService;
        private readonly IValidator<AddSubCategoryToBudgetRequestDto> _addSubCategoryToBudgetRequestValidator;
        private readonly IValidator<UpdateSubCategoryToBudgetRequestDto> _updateSubCategoryToBudgetRequestValidator;

        public BudgetSubCategoryAllocationController(
            IBudgetSubCategoryAllocationService budgetSubCategoryAllocationService, 
            IValidator<AddSubCategoryToBudgetRequestDto> addSubCategoryToBudgetRequestValidator,
            IValidator<UpdateSubCategoryToBudgetRequestDto> updateSubCategoryToBudgetRequestValidator)
        {
            _budgetSubCategoryAllocationService = budgetSubCategoryAllocationService;
            _addSubCategoryToBudgetRequestValidator = addSubCategoryToBudgetRequestValidator;
            _updateSubCategoryToBudgetRequestValidator = updateSubCategoryToBudgetRequestValidator;
        }

        [HttpPost]
        public async Task<IActionResult> AddSubCategoryToBudgetAsync([FromRoute] int budgetId, AddSubCategoryToBudgetRequestDto requestDto)
        {
            var validationBudgetId = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationBudgetId is not null)
                return validationBudgetId;


            var validationSubCategoryId = this.ValidatePositiveId(requestDto.SubCategoryId, "subCategoryId");
            if (validationSubCategoryId is not null)
                return validationSubCategoryId;

            var validationAreaId = this.ValidatePositiveId(requestDto.AreaId, "areaId");
            if (validationAreaId is not null)
                return validationAreaId;

            var validationResult = _addSubCategoryToBudgetRequestValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            requestDto.BudgetId = budgetId;

            var result = await _budgetSubCategoryAllocationService.AddSubCategoryToBudgetAsync(requestDto, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSubCategoryAllocationByBudgetAsync([FromRoute] int budgetId)
        {
            var validationBudgetId = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationBudgetId is not null)
                return validationBudgetId;

            var userId = GetUserId();

            var result = await _budgetSubCategoryAllocationService.GetAllSubCategoryAllocationByBudgetAsync(budgetId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet("by-area/{areaId:int}")]
        public async Task<IActionResult> GetAllSubCategoryAllocationByAreasAsync([FromRoute]int budgetId, [FromRoute] int areaId)
        {
            var validationBudgetId = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationBudgetId is not null)
                return validationBudgetId;

            var validationAreaId = this.ValidatePositiveId(areaId, "areaId");
            if (validationAreaId is not null)
                return validationAreaId;

            var userId = GetUserId();

            var areas = new List<int>
            {
                areaId
            };

            var result = await _budgetSubCategoryAllocationService.GetAllSubCategoryAllocationByAreasAsync(areas, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> RemoveSubCategoryFromBudgetAsync([FromRoute] int budgetId, [FromRoute]int id)
        {
            var validationBudgetId = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationBudgetId is not null)
                return validationBudgetId;

            var validationAllocationId = this.ValidatePositiveId(id, "allocationId");
            if (validationAllocationId is not null)
                return validationAllocationId;

            var userId = GetUserId();

            var result = await _budgetSubCategoryAllocationService.RemoveSubCategoryFromBudgetAsync(id, budgetId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateBudgetSubCategoryAllocationAsync([FromRoute]int budgetId, [FromRoute]int id, [FromBody]UpdateSubCategoryToBudgetRequestDto requestDto)
        {
            var validationBudgetId = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationBudgetId is not null)
                return validationBudgetId;

            var validationAllocationId = this.ValidatePositiveId(id, "allocationId");
            if (validationAllocationId is not null)
                return validationAllocationId;

            var validationResult = _updateSubCategoryToBudgetRequestValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _budgetSubCategoryAllocationService.UpdateBudgetSubCategoryAllocationAsync(requestDto, id, budgetId, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
