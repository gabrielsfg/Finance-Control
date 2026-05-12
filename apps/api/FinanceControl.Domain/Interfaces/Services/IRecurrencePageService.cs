using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IRecurrencePageService
    {
        Task<RecurrencePageResponseDto> GetPageAsync(int userId);
        Task<RecurringTransactionResponseDto> CreateRecurringAsync(int userId, CreateRecurringTransactionRequestDto dto);
        Task<Result<RecurringTransactionResponseDto>> UpdateRecurringAsync(int userId, int id, UpdateRecurringTransactionRequestDto dto);
        Task<Result<bool>> CancelRecurringAsync(int userId, int id);
        Task<Result<RecurringTransactionResponseDto>> ReactivateRecurringAsync(int userId, int id);
        Task<Result<bool>> DeleteRecurringAsync(int userId, int id);
    }
}
