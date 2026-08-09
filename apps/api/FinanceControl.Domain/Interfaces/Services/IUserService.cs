using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using LoginResult = FinanceControl.Shared.Dtos.Response.LoginResult;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IUserService
    {
        // Registration no longer issues tokens: the account is unusable until the emailed
        // code is confirmed through VerifyEmailAsync, which is what returns them.
        //
        // ipAddress and userAgent are read by the controller and stored with the consent
        // record — they are the circumstances of the signature, so they cannot come from
        // the request body.
        Task<Result> RegisterUserAsync(CreateUserRequestDto requestDto, string? ipAddress, string? userAgent);

        // trustedDeviceToken comes from an HttpOnly cookie on web and from the request
        // body on mobile, so the controller reads it and hands it over.
        Task<LoginResult> UserLoginAsync(UserLoginRequestDto requestDto, string? trustedDeviceToken);

        Task<Result<AuthTokensDto>> VerifyEmailAsync(VerifyEmailRequestDto requestDto);

        // Silent by design — an unknown or already-verified address must be indistinguishable
        // from a successful send.
        Task ResendVerificationCodeAsync(string email);

        Task<Result<AuthTokensDto>> VerifyTwoFactorAsync(TwoFactorLoginRequestDto requestDto, string? deviceName);

        Task<Result> UpdateTwoFactorAsync(int userId, UpdateTwoFactorRequestDto requestDto);

        // Returns AuthTokensDto so the controller can set the refresh token
        // as an HttpOnly cookie without including it in the response body.
        Task<AuthTokensDto?> RefreshTokenAsync(string refreshToken);

        Task<UserProfileResponseDto?> GetProfileAsync(int userId);

        Task<UserProfileResponseDto?> UpdateProfileAsync(int userId, UpdateUserProfileRequestDto requestDto);

        Task<UserPreferencesResponseDto?> GetPreferencesAsync(int userId);

        Task<UserPreferencesResponseDto?> UpdatePreferencesAsync(int userId, UpdateUserPreferencesRequestDto requestDto);

        Task ForgotPasswordAsync(string email);

        Task<bool> ResetPasswordAsync(ResetPasswordRequestDto requestDto);

        Task<bool> LogoutAsync(string refreshToken);

        Task<bool> DeleteAccountAsync(int userId, string password);

        Task<bool> ResetDataAsync(int userId, string password);
    }
}
