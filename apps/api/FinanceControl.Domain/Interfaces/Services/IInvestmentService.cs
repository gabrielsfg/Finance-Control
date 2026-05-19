using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Investment;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IInvestmentService
    {
        Task<InvestmentPortfolioDto> GetPortfolioAsync(int userId);
        Task<InvestmentDto> GetByIdAsync(int id, int userId);
        Task<List<InvestmentTransactionDto>> GetTransactionsAsync(int investmentId, int userId);
        Task<List<InvestmentDividendDto>> GetDividendsAsync(int investmentId, int userId);
        Task<InvestmentPortfolioDto> RegisterTransactionAsync(int userId, CreateInvestmentTransactionRequestDto dto);
        Task<InvestmentPortfolioDto> DeleteTransactionAsync(int transactionId, int userId);
        Task<InvestmentPortfolioDto> RegisterDividendAsync(int userId, CreateInvestmentDividendRequestDto dto);
        Task<InvestmentDto> UpdatePriceAsync(int investmentId, int userId, UpdateInvestmentPriceRequestDto dto);
    }
}
