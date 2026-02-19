using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
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
    public class AccountController : BaseController
    {
        private readonly IAccountService _accountService;
        private readonly IValidator<CreateAccountRequestDto> _createAccountValidator;
        private readonly IValidator<UpdateAccountRequestDto> _updateAccountValidator;

        public AccountController(IAccountService accountService, IValidator<CreateAccountRequestDto> createAccountValidator, IValidator<UpdateAccountRequestDto> updateAccountValidator)
        {
            _accountService = accountService;
            _createAccountValidator = createAccountValidator;
            _updateAccountValidator = updateAccountValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAccountAsync([FromBody]CreateAccountRequestDto requestDto)
        {
            var validatonResult = _createAccountValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();

            var result = await _accountService.CreateAccountAsync(requestDto, userId);

            return Created($"/api/accounts", result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAccountAsync()
        {
            var userId = GetUserId();

            var result = await _accountService.GetAllAccountAsync(userId);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAccountByIdAsync([FromRoute] int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _accountService.GetAccountByIdAsync(id, userId);

            if(result == null)
                return NotFound("Account not found.");

            return Ok(result);
        }

        [HttpPatch]
        public async Task<IActionResult> UpdateAccountAsync([FromBody] UpdateAccountRequestDto requestDto)
        {
            var validatonResult = _updateAccountValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var userId = GetUserId();
            var result = await _accountService.UpdateAccountAsync(requestDto, userId);

            if(result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAccountByIdAsync([FromRoute]int id)
        {
            var validationResult = this.ValidatePositiveId(id, "id");
            if (validationResult is not null)
                return validationResult;

            var userId = GetUserId();
            var result = await _accountService.DeleteAccountByIdAsync(id, userId);

            if (result.IsFailure)
                return NotFound(new { error = result.Error });
            return Ok(result.Value);
        }
    }
}
