using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ISubscriptionAccessService
    {
        /// What the user may use right now: any access at all, and which plan.
        Task<SubscriptionAccessResponseDto> GetAccessAsync(int userId, CancellationToken cancellationToken = default);
    }
}
