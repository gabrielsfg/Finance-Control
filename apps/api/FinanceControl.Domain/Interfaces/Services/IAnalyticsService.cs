using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Analytics;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IAnalyticsService
    {
        Task<List<IncomeExpenseItemDto>> GetIncomeExpenseAsync(AnalyticsRequestDto requestDto);
        Task<List<BalanceEvolutionItemDto>> GetBalanceEvolutionAsync(AnalyticsRequestDto requestDto);
        Task<List<ExpensesByCategoryDto>> GetExpensesByCategoryAsync(AnalyticsRequestDto requestDto);
        Task<List<CategoryEvolutionItemDto>> GetCategoryEvolutionAsync(AnalyticsRequestDto requestDto, int categoryId);
        Task<List<NetWorthEvolutionItemDto>> GetNetWorthEvolutionAsync(AnalyticsRequestDto requestDto);
        Task<List<FutureCommitmentsItemDto>> GetFutureCommitmentsAsync(int userId, int months);
        Task<List<SpendingHeatmapItemDto>> GetSpendingHeatmapAsync(AnalyticsRequestDto requestDto);
        Task<BudgetPaceDto?> GetBudgetPaceAsync(int budgetId, int userId);

        // Projections
        Task<BalanceProjectionDto> GetBalanceProjectionAsync(int userId, int? accountId, int lookbackDays = 30);
        Task<List<CategoryProjectionDto>> GetCategoryProjectionAsync(int userId, int? accountId, int lookbackMonths = 3);
        Task<NetWorthProjectionDto> GetNetWorthProjectionAsync(int userId, int projectionMonths = 12, int? targetAmount = null);
        Task<CommitmentsImpactDto> GetCommitmentsImpactAsync(int userId, int months = 6);
    }
}
