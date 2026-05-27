using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IAccountService
    {
        Task<Result<IEnumerable<GetAccountItemResponseDto>>> CreateAccountAsync(CreateAccountRequestDto requestDto, int userId);
        Task<IEnumerable<GetAccountItemResponseDto>> GetAllAccountAsync(int userId);
        Task<GetAccountByIdResponseDto> GetAccountByIdAsync(int id, int userId);
        Task<Result<IEnumerable<GetAccountItemResponseDto>>> UpdateAccountAsync(UpdateAccountRequestDto requestDto, int userId);
        Task<Result<IEnumerable<GetAccountItemResponseDto>>> DeleteAccountByIdAsync(int id, int userId);
        Task<IEnumerable<BalanceHistoryItemDto>?> GetBalanceHistoryAsync(int accountId, int userId, int days = 30);
    }
}
