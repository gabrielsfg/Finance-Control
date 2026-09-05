using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IFeedbackService
    {
        Task<Result<GetFeedbackResponseDto>> CreateFeedbackAsync(
            CreateFeedbackRequestDto requestDto,
            int userId);
    }
}
