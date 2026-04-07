using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IUserService
    {
        Task<User?> RegisterUserAsync(CreateUserRequestDto requestDto);

        Task<AuthResponseDto?> UserLoginAsync(UserLoginRequestDto requestDto);

        Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
    }
}
