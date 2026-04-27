using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IBankService
    {
        IReadOnlyList<BankResponseDto> GetBanks(string country);
    }
}
