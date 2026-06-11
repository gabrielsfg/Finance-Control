using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IAlertRuleService
    {
        Task<IEnumerable<GetAlertRuleResponseDto>> GetAllAsync(int userId);
        Task<Result<IEnumerable<GetAlertRuleResponseDto>>> CreateAsync(CreateAlertRuleRequestDto requestDto, int userId);

        // Mutations return the full updated list (project convention).
        Task<IEnumerable<GetAlertRuleResponseDto>> DeleteAsync(int id, int userId);
    }
}
