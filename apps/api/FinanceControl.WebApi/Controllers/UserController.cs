using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Services.Extensions;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseController
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
        public async Task<IActionResult> RegisterUserAsync([FromBody] CreateUserRequestDto requestDto)
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
        public async Task<IActionResult> UserLoginAsync([FromBody] UserLoginRequestDto requestDto)
        {
            var validatonResult = _userLoginValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var response = await _userService.UserLoginAsync(requestDto);
            if (response is null)
                return BadRequest("Invalid email or password.");

            return Ok(response);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshTokenAsync([FromBody] RefreshTokenRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.RefreshToken))
                return BadRequest("Refresh token is required.");

            var response = await _userService.RefreshTokenAsync(requestDto.RefreshToken);
            if (response is null)
                return Unauthorized("Invalid or expired refresh token.");

            return Ok(response);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfileAsync()
        {
            var profile = await _userService.GetProfileAsync(GetUserId());
            if (profile is null)
                return NotFound();

            return Ok(profile);
        }

        [HttpPatch("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfileAsync([FromBody] UpdateUserProfileRequestDto requestDto)
        {
            var profile = await _userService.UpdateProfileAsync(GetUserId(), requestDto);
            if (profile is null)
                return BadRequest("Email already in use.");

            return Ok(profile);
        }

        [HttpGet("preferences")]
        [Authorize]
        public async Task<IActionResult> GetPreferencesAsync()
        {
            var prefs = await _userService.GetPreferencesAsync(GetUserId());
            if (prefs is null)
                return NotFound();

            return Ok(prefs);
        }

        [HttpPatch("preferences")]
        [Authorize]
        public async Task<IActionResult> UpdatePreferencesAsync([FromBody] UpdateUserPreferencesRequestDto requestDto)
        {
            var prefs = await _userService.UpdatePreferencesAsync(GetUserId(), requestDto);
            if (prefs is null)
                return NotFound();

            return Ok(prefs);
        }

        [HttpGet("currencies")]
        [Authorize]
        public IActionResult GetCurrenciesAsync()
        {
            return Ok(_userService.GetAvailableCurrencies());
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPasswordAsync([FromBody] ForgotPasswordRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Email))
                return BadRequest("Email is required.");

            var token = await _userService.ForgotPasswordAsync(requestDto.Email);

            // Always return 200 to avoid email enumeration.
            // Token is returned directly (dev mode — replace with email delivery in production).
            return Ok(new { resetToken = token });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Token) || string.IsNullOrWhiteSpace(requestDto.NewPassword))
                return BadRequest("Token and new password are required.");

            var success = await _userService.ResetPasswordAsync(requestDto.Token, requestDto.NewPassword);
            if (!success)
                return BadRequest("Invalid or expired reset token.");

            return Ok(new { message = "Password reset successfully." });
        }
    }
}
