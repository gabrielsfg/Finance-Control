using FinanceControl.Domain.Interfaces.Services;
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
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionController : BaseController
    {
        private readonly ITransactionService _transactionService;
        private readonly IValidator<CreateTransactionRequestDto> _createTransactionValidator;
        private readonly IValidator<UpdateTransactionRequestDto> _updateTransactionValidator;
        private readonly IValidator<UpdateRecurringTransactionRequestDto> _updateRecurringTransactionValidator;

        public TransactionController(
            ITransactionService transactionService,
            IValidator<CreateTransactionRequestDto> createTransactionValidator,
            IValidator<UpdateTransactionRequestDto> updateTransactionValidator,
            IValidator<UpdateRecurringTransactionRequestDto> updateRecurringTransactionValidator)
        {
            _transactionService = transactionService;
            _createTransactionValidator = createTransactionValidator;
            _updateTransactionValidator = updateTransactionValidator;
            _updateRecurringTransactionValidator = updateRecurringTransactionValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransactionAsync([FromBody] CreateTransactionRequestDto requestDto)
        {
            var validationResult = _createTransactionValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _transactionService.CreateTransactionAsync(requestDto, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Created($"/api/transaction", result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTransactionsAsync()
        {
            var userId = GetUserId();

            var result = await _transactionService.GetAllTransactionsAsync(userId);
            return Ok(result);
        }

        [HttpGet("by-budget/{budgetId:int}")]
        public async Task<IActionResult> GetAllTransactionsByBudgetAsync([FromRoute] int budgetId)
        {
            var validationBudgetId = this.ValidatePositiveId(budgetId, "budgetId");
            if (validationBudgetId is not null)
                return validationBudgetId;

            var userId = GetUserId();

            var result = await _transactionService.GetAllTransactionsByBudgetAsync(budgetId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet("by-account/{accountId:int}")]
        public async Task<IActionResult> GetAllTransactionsByAccountAsync([FromRoute] int accountId)
        {
            var validationAccountId = this.ValidatePositiveId(accountId, "accountId");
            if (validationAccountId is not null)
                return validationAccountId;

            var userId = GetUserId();

            var result = await _transactionService.GetAllTransactionsByAccountAsync(accountId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet("by-subcategory/{subCategoryId:int}")]
        public async Task<IActionResult> GetAllTransactionsBySubCategoryAsync([FromRoute] int subCategoryId)
        {
            var validationSubCategoryId = this.ValidatePositiveId(subCategoryId, "subCategoryId");
            if (validationSubCategoryId is not null)
                return validationSubCategoryId;

            var userId = GetUserId();

            var result = await _transactionService.GetAllTransactionsBySubCategoryAsync(subCategoryId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTransactionByIdAsync([FromRoute] int id)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var userId = GetUserId();

            var result = await _transactionService.GetTransactionByIdAsync(id, userId);
            if (result is null)
                return NotFound(new { error = "Transaction not found." });

            return Ok(result);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateTransactionAsync([FromRoute] int id, [FromBody] UpdateTransactionRequestDto requestDto)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var validationResult = _updateTransactionValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _transactionService.UpdateTransactionAsync(requestDto, id, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTransactionAsync([FromRoute] int id)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var userId = GetUserId();

            var result = await _transactionService.DeleteTransactionAsync(id, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPatch("{id:int}/recurring")]
        public async Task<IActionResult> UpdateRecurringTransactionAsync([FromRoute] int id, [FromBody] UpdateRecurringTransactionRequestDto requestDto)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var validationResult = _updateRecurringTransactionValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _transactionService.UpdateRecurringTransactionAsync(requestDto, id, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPatch("{id:int}/recurring/cancel")]
        public async Task<IActionResult> CancelRecurringTransactionAsync([FromRoute] int id)
        {
            var validationId = this.ValidatePositiveId(id, "id");
            if (validationId is not null)
                return validationId;

            var userId = GetUserId();

            var result = await _transactionService.CancelRecurringTransactionAsync(id, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}

