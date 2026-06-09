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
using Microsoft.AspNetCore.RateLimiting;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseController
    {
        private const string RefreshTokenCookieName = "refreshToken";

        private readonly IUserService _userService;
        private readonly IValidator<CreateUserRequestDto> _createUserValidator;
        private readonly IValidator<UserLoginRequestDto> _userLoginValidator;
        private readonly IValidator<UpdateUserPreferencesRequestDto> _updatePreferencesValidator;

        public UserController(
            IUserService userService,
            IValidator<CreateUserRequestDto> createUserValidator,
            IValidator<UserLoginRequestDto> userLoginValidator,
            IValidator<UpdateUserPreferencesRequestDto> updatePreferencesValidator)
        {
            _userService = userService;
            _createUserValidator = createUserValidator;
            _userLoginValidator = userLoginValidator;
            _updatePreferencesValidator = updatePreferencesValidator;
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RegisterUserAsync([FromBody] CreateUserRequestDto requestDto)
        {
            var validatonResult = _createUserValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var tokens = await _userService.RegisterUserAsync(requestDto);
            if (tokens is null)
                return BadRequest("Email already exists.");

            SetRefreshTokenCookie(tokens.RefreshToken);
            return Ok(new AuthResponseDto { AccessToken = tokens.AccessToken });
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> UserLoginAsync([FromBody] UserLoginRequestDto requestDto)
        {
            var validatonResult = _userLoginValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.UserLoginAsync(requestDto);

            if (result.IsLockedOut)
            {
                var seconds = (int)Math.Ceiling(result.LockoutRemaining!.Value.TotalSeconds);
                return StatusCode(423, new { message = "Account is locked. Try again later.", retryAfterSeconds = seconds });
            }

            if (result.AuthResponse is null)
                return BadRequest("Invalid email or password.");

            SetRefreshTokenCookie(result.AuthResponse.RefreshToken);
            return Ok(new AuthResponseDto { AccessToken = result.AuthResponse.AccessToken });
        }

        [HttpPost("refresh")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RefreshTokenAsync()
        {
            var refreshToken = Request.Cookies[RefreshTokenCookieName];
            if (string.IsNullOrWhiteSpace(refreshToken))
                return Unauthorized("Refresh token cookie is missing.");

            var tokens = await _userService.RefreshTokenAsync(refreshToken);
            if (tokens is null)
                return Unauthorized("Invalid or expired refresh token.");

            SetRefreshTokenCookie(tokens.RefreshToken);
            return Ok(new AuthResponseDto { AccessToken = tokens.AccessToken });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> LogoutAsync()
        {
            var refreshToken = Request.Cookies[RefreshTokenCookieName];

            if (!string.IsNullOrWhiteSpace(refreshToken))
                await _userService.LogoutAsync(refreshToken);

            // Clear the cookie regardless of whether the token was valid —
            // the client should always end up logged out.
            ClearRefreshTokenCookie();
            return NoContent();
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
            var validationResult = _updatePreferencesValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var prefs = await _userService.UpdatePreferencesAsync(GetUserId(), requestDto);
            if (prefs is null)
                return NotFound();

            return Ok(prefs);
        }

        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteAccountAsync([FromBody] DeleteAccountRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Password))
                return BadRequest("Password is required.");

            var success = await _userService.DeleteAccountAsync(GetUserId(), requestDto.Password);
            if (!success)
                return BadRequest("Invalid password.");

            ClearRefreshTokenCookie();
            return NoContent();
        }

        [HttpPost("me/reset-data")]
        [Authorize]
        public async Task<IActionResult> ResetDataAsync([FromBody] ResetDataRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Password))
                return BadRequest("Password is required.");

            var success = await _userService.ResetDataAsync(GetUserId(), requestDto.Password);
            if (!success)
                return BadRequest("Invalid password.");

            return NoContent();
        }

        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth")]
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
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Token) || string.IsNullOrWhiteSpace(requestDto.NewPassword))
                return BadRequest("Token and new password are required.");

            var success = await _userService.ResetPasswordAsync(requestDto.Token, requestDto.NewPassword);
            if (!success)
                return BadRequest("Invalid or expired reset token.");

            return Ok(new { message = "Password reset successfully." });
        }

        // ── Cookie helpers ────────────────────────────────────────────────────

        private void SetRefreshTokenCookie(string refreshToken)
        {
            Response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
            {
                HttpOnly = true,   // JavaScript cannot read this cookie
                Secure = true,     // HTTPS only
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            });
        }

        private void ClearRefreshTokenCookie()
        {
            Response.Cookies.Append(RefreshTokenCookieName, string.Empty, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UnixEpoch,
                Path = "/"
            });
        }
    }
}
