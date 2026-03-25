using FinanceControl.Shared.Dtos.Others;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface ITransactionService
    {
        Task<Result<CreateTransactionResponseDto>> CreateTransactionAsync(CreateTransactionRequestDto requestDto, int userId);
        Task<IEnumerable<GetTransactionResponseDto>> GetAllTransactionsAsync(int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> GetAllTransactionsByBudgetAsync(int budgetId, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> GetAllTransactionsByAccountAsync(int accountId, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> GetAllTransactionsBySubCategoryAsync(int subCategoryId, int userId);
        Task<GetTransactionByIdResponseDto?> GetTransactionByIdAsync(int id, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> UpdateTransactionAsync(UpdateTransactionRequestDto requestDto, int id, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> DeleteTransactionAsync(int id, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> UpdateRecurringTransactionAsync(UpdateRecurringTransactionRequestDto requestDto, int transactionId, int userId);
        Task<Result<IEnumerable<GetTransactionResponseDto>>> CancelRecurringTransactionAsync(int transactionId, int userId);

        /// <summary>
        /// Main Page Endpoints
        /// </summary>
        Task<BalanceSummaryDto> GetSummaryBalanceAsync(MainPageSummaryRequestDto requestDto);
        Task<List<RecentTransactionDto>> GetRecentTransactionsAsync(MainPageSummaryRequestDto requestDto);
        Task<BudgetSummaryDto> GetBudgetSummaryAsync(MainPageSummaryRequestDto requestDto);
        Task<List<TopCategoryItemDto>> GetTopCategoriesAsync(MainPageSummaryRequestDto requestDto);
    }
}
