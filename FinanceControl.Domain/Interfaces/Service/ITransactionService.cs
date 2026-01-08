using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface ITransactionService
    {
        Task<int> CreateTransactionAsync(CreateTransactionRequestDto requestDto);

        Task<TransactionResponseDto?> GetTransactionByIdAsync(int transactionId);

        Task<PagedResponse<TransactionResponseDto>> GetAllTransactionsPagedAsync(int page, int pageSize);

        Task UpdateTransactionAsyncById( UpdateTransactionRequestDto requestDto);

        Task DeleteTransactionById(int transactionId);
    }
}
