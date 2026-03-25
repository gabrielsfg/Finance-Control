using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IBudgetService
    {
        Task<Result<GetBudgetWithAreasResponseDto>> CreateBudgetAsync(CreateBudgetRequestDto requestDto, int userId);
        Task<IEnumerable<GetAllBudgetResponseDto>> GetAllBudgetAsync(int userId);
        Task<GetBudgetByIdResponseDto> GetBudgetByIdAsync(int id, int userId);
        Task<GetBudgetWithAreasResponseDto> GetBudgetWithAllocationsAsync(int id, int userId);
        Task<Result<GetBudgetWithAreasResponseDto>> UpdateBudgetAsync(UpdateBudgetRequestDto requestDto, int userId);
        Task<Result<IEnumerable<GetAllBudgetResponseDto>>> DeleteBudgetAsync(int id, int userId);
    }
}
