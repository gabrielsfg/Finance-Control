using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IValidator<CreateUserRequestDto> _createUserValidator;
        private readonly IValidator<UserLoginRequestDto> _userLoginValidator;

        public UserController(IUserService userService, IValidator<CreateUserRequestDto> createUserValidator, IValidator<UserLoginRequestDto> userLoginValidator)
        {
            _userService = userService;
            _createUserValidator = createUserValidator;
            _userLoginValidator = userLoginValidator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUserAsync([FromBody]CreateUserRequestDto requestDto)
        {
            var validatonResult = _createUserValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var user = await _userService.RegisterUserAsync(requestDto);
            if (user is null)
                return BadRequest("Email already existis.");

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<IActionResult> UserLoginAsync([FromBody]UserLoginRequestDto requestDto)
        {
            var validatonResult = _userLoginValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var token = await _userService.UserLoginAsync(requestDto);
            if (token is null)
                return BadRequest("Invalid email or password.");
            return Ok(token);
        }
    }
}
