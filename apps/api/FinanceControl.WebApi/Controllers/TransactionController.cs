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

        public TransactionController(
            ITransactionService transactionService,
            IValidator<CreateTransactionRequestDto> createTransactionValidator,
            IValidator<UpdateTransactionRequestDto> updateTransactionValidator)
        {
            _transactionService = transactionService;
            _createTransactionValidator = createTransactionValidator;
            _updateTransactionValidator = updateTransactionValidator;
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

        [HttpGet("filtered")]
        public async Task<IActionResult> GetAllTransactionsFilteredAsync([FromQuery] GetTransactionsFilterRequestDto requestDto)
        {
            var userId = GetUserId();

            var result = await _transactionService.GetAllTransactionsFilteredAsync(requestDto, userId);
            return Ok(result);
        }

        /// <summary>
        /// Feeds the CSV export on the transactions page: same filters as
        /// <c>/filtered</c>, every matching row, no paging.
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportTransactionsAsync([FromQuery] GetTransactionsFilterRequestDto requestDto)
        {
            var result = await _transactionService.ExportFilteredTransactionsAsync(requestDto, GetUserId());
            return Ok(result);
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
                return result.Error == "Transaction not found."
                    ? NotFound(new { error = result.Error })
                    : BadRequest(new { error = result.Error });

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

    }
}

