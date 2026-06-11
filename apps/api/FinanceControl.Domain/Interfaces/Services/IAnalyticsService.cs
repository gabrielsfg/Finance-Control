using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Analytics;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IAnalyticsService
    {
        Task<AnalyticsSummaryDto> GetSummaryAsync(AnalyticsRequestDto requestDto);
        Task<List<IncomeExpenseItemDto>> GetIncomeExpenseAsync(AnalyticsRequestDto requestDto);
        Task<List<BalanceEvolutionItemDto>> GetBalanceEvolutionAsync(AnalyticsRequestDto requestDto);
        Task<List<CategoryEvolutionItemDto>> GetCategoryEvolutionAsync(AnalyticsRequestDto requestDto, int categoryId);
        Task<List<NetWorthEvolutionItemDto>> GetNetWorthEvolutionAsync(AnalyticsRequestDto requestDto);
        Task<List<FutureCommitmentsItemDto>> GetFutureCommitmentsAsync(int userId, int months);
        Task<List<SpendingHeatmapItemDto>> GetSpendingHeatmapAsync(AnalyticsRequestDto requestDto);

        // Projections
        Task<BalanceProjectionDto> GetBalanceProjectionAsync(int userId, int? accountId, int lookbackDays = 30);
        Task<List<CategoryProjectionDto>> GetCategoryProjectionAsync(int userId, int? accountId, int lookbackMonths = 3);
        Task<NetWorthProjectionDto> GetNetWorthProjectionAsync(int userId, int projectionMonths = 12, int? targetAmount = null);
        Task<CommitmentsImpactDto> GetCommitmentsImpactAsync(int userId, int months = 6);
        Task<PassiveIncomeProjectionDto> GetPassiveIncomeProjectionAsync(int userId, int projectionMonths = 24);
        Task<FinancialMilestonesDto> GetFinancialMilestonesAsync(int userId);
        Task<PortfolioCompositionProjectionDto> GetPortfolioCompositionProjectionAsync(int userId, int projectionMonths = 12);
        Task<RealNetWorthDto> GetRealNetWorthAsync(int userId);

        // Savings (budget-period based)
        Task<SavingsPeriodsDto?> GetSavingsPeriodsAsync(int userId, int budgetId, int periods = 12);
        Task<SavingsDetailDto?> GetSavingsDetailAsync(int userId, int budgetId, DateOnly? periodStart = null);

        // Investment analytics
        Task<InvestmentEvolutionResponseDto> GetInvestmentEvolutionAsync(int userId, DateOnly startDate, DateOnly finishDate);
        Task<ProfitabilityTotalsDto> GetInvestmentProfitabilityTotalsAsync(int userId, DateOnly startDate, DateOnly finishDate);
        Task<AnnualReturnsResponseDto> GetInvestmentAnnualReturnsAsync(int userId, DateOnly startDate, DateOnly finishDate);
        Task<List<ProfitabilityVsCdiPointDto>> GetInvestmentProfitabilityVsCdiAsync(int userId, DateOnly startDate, DateOnly finishDate);
        Task<ProfitabilityVsBenchmarksResponseDto> GetInvestmentProfitabilityVsBenchmarksAsync(int userId, DateOnly startDate, DateOnly finishDate);
        Task<InvestmentLaunchesResponseDto> GetInvestmentLaunchesAsync(int userId, DateOnly startDate, DateOnly finishDate);
    }
}
