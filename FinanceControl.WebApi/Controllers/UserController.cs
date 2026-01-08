using FinanceControl.Domain.Interfaces.Service;
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
        private readonly IValidator<CreateUserRequestDto> _validator;

        public UserController(IUserService userService, IValidator<CreateUserRequestDto> validator)
        {
            _userService = userService;
            _validator = validator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUserAsync([FromBody]CreateUserRequestDto requestDto)
        {
            var validatorResult = _validator.Validate(requestDto);

            if (!validatorResult.IsValid)
            {
                return ValidationProblem(new ValidationProblemDetails(validatorResult.ToDictionary())
                {
                    Title = "Validation failed",
                    Detail = "One or more validation error ocurred"
                });
            }

            var user = await _userService.RegisterUserAsync(requestDto);
            if (user is null)
                return BadRequest("Email already existis.");

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<IActionResult> UserLoginAsync([FromBody]UserLoginRequestDto requestDto)
        {
            var token = await _userService.UserLoginAsync(requestDto);
            if (token is null)
                return BadRequest("Invalid email or password.");
            return Ok(token);
        }
    }
}
