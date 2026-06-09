using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using LoginResult = FinanceControl.Shared.Dtos.Response.LoginResult;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IUserService
    {
        // Returns AuthTokensDto so the controller can set the refresh token
        // as an HttpOnly cookie without including it in the response body.
        Task<AuthTokensDto?> RegisterUserAsync(CreateUserRequestDto requestDto);

        Task<LoginResult> UserLoginAsync(UserLoginRequestDto requestDto);

        Task<AuthTokensDto?> RefreshTokenAsync(string refreshToken);

        Task<UserProfileResponseDto?> GetProfileAsync(int userId);

        Task<UserProfileResponseDto?> UpdateProfileAsync(int userId, UpdateUserProfileRequestDto requestDto);

        Task<UserPreferencesResponseDto?> GetPreferencesAsync(int userId);

        Task<UserPreferencesResponseDto?> UpdatePreferencesAsync(int userId, UpdateUserPreferencesRequestDto requestDto);

        Task<string?> ForgotPasswordAsync(string email);

        Task<bool> ResetPasswordAsync(string token, string newPassword);

        Task<bool> LogoutAsync(string refreshToken);

        Task<bool> DeleteAccountAsync(int userId, string password);

        Task<bool> ResetDataAsync(int userId, string password);
    }
}
