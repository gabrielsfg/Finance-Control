using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Dtos.Response.Investment;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IGoalService
    {
        Task<GoalResponseDto> CreateAsync(int userId, CreateGoalRequestDto dto);
        Task<IReadOnlyList<GoalResponseDto>> GetAllAsync(int userId, EnumGoalType? type, EnumGoalStatus? status);
        Task<GoalDetailResponseDto?> GetByIdAsync(int userId, int id);
        Task<Result<GoalResponseDto>> UpdateAsync(int userId, int id, UpdateGoalRequestDto dto);
        Task<Result<bool>> DeleteAsync(int userId, int id, int? returnToAccountId);
        Task<Result<GoalResponseDto>> RecordContributionAsync(int userId, int id, RecordGoalContributionRequestDto dto);
        Task<Result<GoalResponseDto>> WithdrawAsync(int userId, int id, WithdrawGoalRequestDto dto);
        Task<Result<GoalResponseDto>> RegisterPurchaseAsync(int userId, int id, RegisterGoalPurchaseRequestDto dto);
        Task<Result<IReadOnlyList<InvestmentTransactionDto>>> GetInvestmentTransactionsAsync(int userId, int id);
    }
}
