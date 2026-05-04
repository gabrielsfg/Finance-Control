using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
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
        Task<Result<bool>> DeleteAsync(int userId, int id);
        Task<Result<GoalCheckpointDto>> RecordCheckpointAsync(int userId, int id, int amount);
        Task<Result<GoalResponseDto>> AchieveAsync(int userId, int id);
    }
}
