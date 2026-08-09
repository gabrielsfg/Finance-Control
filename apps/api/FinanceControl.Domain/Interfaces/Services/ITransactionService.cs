using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ITransactionService
    {
        Task<Result<CreateTransactionResponseDto>> CreateTransactionAsync(CreateTransactionRequestDto requestDto, int userId);
        Task<IEnumerable<GetTransactionResponseDto>> GetAllTransactionsAsync(int userId);
        Task<GetTransactionsFilteredResponseDto> GetAllTransactionsFilteredAsync(GetTransactionsFilterRequestDto requestDto, int userId);

        // Same filters as the list, without the paging — the export is of what the
        // filters select, not of the page the user stopped on.
        Task<List<GetTransactionResponseDto>> ExportFilteredTransactionsAsync(GetTransactionsFilterRequestDto requestDto, int userId);
        Task<GetTransactionByIdResponseDto?> GetTransactionByIdAsync(int id, int userId);
        Task<Result<CreateTransactionResponseDto>> UpdateTransactionAsync(UpdateTransactionRequestDto requestDto, int id, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> DeleteTransactionAsync(int id, int userId);

        /// <summary>
        /// Main Page Endpoints
        /// </summary>
        Task<BalanceSummaryDto> GetSummaryBalanceAsync(MainPageSummaryRequestDto requestDto);
        Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(MainPageSummaryRequestDto requestDto);
        Task<BudgetSummaryDto?> GetBudgetSummaryAsync(MainPageSummaryRequestDto requestDto);
        Task<List<TopCategoryItemDto>> GetTopCategoriesAsync(MainPageSummaryRequestDto requestDto);
        Task<List<SpendingPredictionItemDto>> GetSpendingPredictionAsync(MainPageSummaryRequestDto requestDto);
    }
}
