using FinanceControl.Data.Data;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Billing;
using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Services.Services
{
    public class SubscriptionAccessService : ISubscriptionAccessService
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionAccessService(ApplicationDbContext context)
        {
            _context = context;
        }

        public Task<SubscriptionAccessResponseDto> GetAccessAsync(int userId, CancellationToken cancellationToken = default) =>
            SubscriptionRules.GetAccessAsync(_context, userId, DateTime.UtcNow, cancellationToken);
    }
}
