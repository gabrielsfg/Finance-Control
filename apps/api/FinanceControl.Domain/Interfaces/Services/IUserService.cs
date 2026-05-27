using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using LoginResult = FinanceControl.Shared.Dtos.Response.LoginResult;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IUserService
    {
        Task<User?> RegisterUserAsync(CreateUserRequestDto requestDto);

        Task<LoginResult> UserLoginAsync(UserLoginRequestDto requestDto);

        Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);

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
