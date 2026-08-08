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
        private const string TrustedDeviceCookieName = "trustedDevice";

        private readonly IUserService _userService;
        private readonly IValidator<CreateUserRequestDto> _createUserValidator;
        private readonly IValidator<UserLoginRequestDto> _userLoginValidator;
        private readonly IValidator<UpdateUserPreferencesRequestDto> _updatePreferencesValidator;
        private readonly IValidator<VerifyEmailRequestDto> _verifyEmailValidator;
        private readonly IValidator<TwoFactorLoginRequestDto> _twoFactorLoginValidator;
        private readonly IValidator<ResetPasswordRequestDto> _resetPasswordValidator;

        public UserController(
            IUserService userService,
            IValidator<CreateUserRequestDto> createUserValidator,
            IValidator<UserLoginRequestDto> userLoginValidator,
            IValidator<UpdateUserPreferencesRequestDto> updatePreferencesValidator,
            IValidator<VerifyEmailRequestDto> verifyEmailValidator,
            IValidator<TwoFactorLoginRequestDto> twoFactorLoginValidator,
            IValidator<ResetPasswordRequestDto> resetPasswordValidator)
        {
            _userService = userService;
            _createUserValidator = createUserValidator;
            _userLoginValidator = userLoginValidator;
            _updatePreferencesValidator = updatePreferencesValidator;
            _verifyEmailValidator = verifyEmailValidator;
            _twoFactorLoginValidator = twoFactorLoginValidator;
            _resetPasswordValidator = resetPasswordValidator;
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RegisterUserAsync([FromBody] CreateUserRequestDto requestDto)
        {
            var validatonResult = _createUserValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.RegisterUserAsync(requestDto);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            // No tokens yet — the client goes to the verification screen and comes back
            // through verify-email, which is what signs the user in.
            return Ok(new { verificationRequired = true });
        }

        [HttpPost("verify-email")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> VerifyEmailAsync([FromBody] VerifyEmailRequestDto requestDto)
        {
            var validationResult = _verifyEmailValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.VerifyEmailAsync(requestDto);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            SetRefreshTokenCookie(result.Value!.RefreshToken);
            return Ok(new AuthResponseDto { AccessToken = result.Value.AccessToken });
        }

        [HttpPost("verify-email/resend")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResendVerificationCodeAsync([FromBody] ResendVerificationCodeRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Email))
                return BadRequest("Email is required.");

            await _userService.ResendVerificationCodeAsync(requestDto.Email);

            // Always 204, even for an address that does not exist or is already verified:
            // any difference here is a way to test whether an email is registered.
            return NoContent();
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> UserLoginAsync([FromBody] UserLoginRequestDto requestDto)
        {
            var validatonResult = _userLoginValidator.Validate(requestDto);
            if (validatonResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.UserLoginAsync(requestDto, Request.Cookies[TrustedDeviceCookieName]);

            if (result.IsLockedOut)
            {
                var seconds = (int)Math.Ceiling(result.LockoutRemaining!.Value.TotalSeconds);
                return StatusCode(423, new { message = "Account is locked. Try again later.", retryAfterSeconds = seconds });
            }

            // 503, not 400: the credentials were fine and retrying is the right move.
            if (result.EmailDeliveryFailed)
                return StatusCode(503, new { error = "Could not send the verification code. Please try again." });

            // The password was right but a second gate is open. 200 with the reason, not an
            // error status: nothing went wrong, the flow simply has another step.
            if (result.Challenge is { } challenge)
                return Ok(new LoginChallengeResponseDto { Challenge = challenge, ChallengeToken = result.ChallengeToken });

            if (result.AuthResponse is null)
                return BadRequest("Invalid email or password.");

            SetRefreshTokenCookie(result.AuthResponse.RefreshToken);
            return Ok(new AuthResponseDto { AccessToken = result.AuthResponse.AccessToken });
        }

        [HttpPost("login/two-factor")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> VerifyTwoFactorAsync([FromBody] TwoFactorLoginRequestDto requestDto)
        {
            var validationResult = _twoFactorLoginValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.VerifyTwoFactorAsync(requestDto, Request.Headers.UserAgent.ToString());
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            SetRefreshTokenCookie(result.Value!.RefreshToken);

            if (result.Value.TrustedDeviceToken is { } trustedDeviceToken)
                SetTrustedDeviceCookie(trustedDeviceToken);

            return Ok(new AuthResponseDto { AccessToken = result.Value.AccessToken });
        }

        [HttpPatch("two-factor")]
        [Authorize]
        public async Task<IActionResult> UpdateTwoFactorAsync([FromBody] UpdateTwoFactorRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.Password))
                return BadRequest("Password is required.");

            var result = await _userService.UpdateTwoFactorAsync(GetUserId(), requestDto);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            // The cookie on this browser is meaningless once the devices are dropped.
            if (!requestDto.Enabled)
                ClearTrustedDeviceCookie();

            return NoContent();
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
            // The trusted-device cookie deliberately survives: logging out is not
            // distrusting the machine, and clearing it would ask for a code on every login.
            ClearRefreshTokenCookie();
            return NoContent();
        }

        // ── Mobile auth ───────────────────────────────────────────────────────
        // Native apps have no browser XSS surface, so they store the refresh
        // token in the OS keystore (Keychain/Keystore) and carry it in the
        // request body instead of an HttpOnly cookie. These variants return and
        // accept the token pair in the body; the web endpoints above are the
        // authoritative cookie-based flow and are intentionally left untouched.

        [HttpPost("mobile/register")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RegisterMobileAsync([FromBody] CreateUserRequestDto requestDto)
        {
            var validationResult = _createUserValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.RegisterUserAsync(requestDto);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Ok(new { verificationRequired = true });
        }

        [HttpPost("mobile/verify-email")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> VerifyEmailMobileAsync([FromBody] VerifyEmailRequestDto requestDto)
        {
            var validationResult = _verifyEmailValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.VerifyEmailAsync(requestDto);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpPost("mobile/login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> LoginMobileAsync([FromBody] UserLoginRequestDto requestDto)
        {
            var validationResult = _userLoginValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            // The trust token lives in the keystore and rides in the body here — there is
            // no cookie jar on the device to carry it automatically.
            var result = await _userService.UserLoginAsync(requestDto, requestDto.TrustedDeviceToken);

            if (result.IsLockedOut)
            {
                var seconds = (int)Math.Ceiling(result.LockoutRemaining!.Value.TotalSeconds);
                return StatusCode(423, new { message = "Account is locked. Try again later.", retryAfterSeconds = seconds });
            }

            // 503, not 400: the credentials were fine and retrying is the right move.
            if (result.EmailDeliveryFailed)
                return StatusCode(503, new { error = "Could not send the verification code. Please try again." });

            if (result.Challenge is { } challenge)
                return Ok(new LoginChallengeResponseDto { Challenge = challenge, ChallengeToken = result.ChallengeToken });

            if (result.AuthResponse is null)
                return BadRequest("Invalid email or password.");

            return Ok(result.AuthResponse);
        }

        [HttpPost("mobile/login/two-factor")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> VerifyTwoFactorMobileAsync([FromBody] TwoFactorLoginRequestDto requestDto)
        {
            var validationResult = _twoFactorLoginValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var result = await _userService.VerifyTwoFactorAsync(requestDto, deviceName: null);
            if (result.IsFailure)
                return BadRequest(new { error = result.Error });

            // TrustedDeviceToken travels in the body; the app keeps it beside the refresh
            // token and sends it back on the next login.
            return Ok(result.Value);
        }

        [HttpPost("mobile/refresh")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RefreshMobileAsync([FromBody] RefreshTokenRequestDto requestDto)
        {
            if (string.IsNullOrWhiteSpace(requestDto.RefreshToken))
                return Unauthorized("Refresh token is missing.");

            var tokens = await _userService.RefreshTokenAsync(requestDto.RefreshToken);
            if (tokens is null)
                return Unauthorized("Invalid or expired refresh token.");

            return Ok(tokens);
        }

        [HttpPost("mobile/logout")]
        [Authorize]
        public async Task<IActionResult> LogoutMobileAsync([FromBody] LogoutRequestDto requestDto)
        {
            if (!string.IsNullOrWhiteSpace(requestDto.RefreshToken))
                await _userService.LogoutAsync(requestDto.RefreshToken);

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
            ClearTrustedDeviceCookie();
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

            await _userService.ForgotPasswordAsync(requestDto.Email);

            // Always 200 and never the code itself: the response is identical for a
            // registered and an unregistered address, so it cannot be used to enumerate.
            return Ok(new { message = "If the email exists, a reset code has been sent." });
        }

        [HttpPost("reset-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequestDto requestDto)
        {
            var validationResult = _resetPasswordValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var success = await _userService.ResetPasswordAsync(requestDto);
            if (!success)
                return BadRequest("Invalid or expired code.");

            // Every session died with the old password, this one included.
            ClearRefreshTokenCookie();
            ClearTrustedDeviceCookie();
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

        // Same protections as the refresh cookie, and for the same reason: whoever holds
        // this value skips the second factor, so script must never be able to read it.
        // Its lifetime matches TrustedDeviceLifetime in UserService.
        private void SetTrustedDeviceCookie(string trustedDeviceToken)
        {
            Response.Cookies.Append(TrustedDeviceCookieName, trustedDeviceToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                Path = "/"
            });
        }

        private void ClearTrustedDeviceCookie()
        {
            Response.Cookies.Append(TrustedDeviceCookieName, string.Empty, new CookieOptions
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
