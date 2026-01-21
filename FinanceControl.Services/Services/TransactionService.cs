using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Enums;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services;

public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;
    public TransactionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateTransactionAsync(CreateTransactionRequestDto requestDto)
    {
        Transaction transaction = new Transaction(
            requestDto.Value,
            Enum.Parse<EnumTransactionType>(requestDto.Type),
            requestDto.Category,
            requestDto.Date,
            Enum.Parse<EnumPaymentType>(requestDto.PaymentType),
            Enum.Parse<EnumPaymentRecurrence>(requestDto.Reccurence),
            requestDto.Description
            );

        await _context.Transactions.AddAsync(transaction);
        await _context.SaveChangesAsync();

        return transaction.Id;
    }

    public async Task<TransactionResponseDto?> GetTransactionByIdAsync(int transactionId)
    {
        var transaction = await _context.Transactions.FindAsync(transactionId);

        if (transaction == null)
            return null;

        TransactionResponseDto response = new TransactionResponseDto()
        {
            Id = transaction.Id,
            Value = transaction.Value,
            Category = transaction.Category,
            Type = transaction.Type.ToString(),
            TransactionDate = transaction.TransactionDate,
            PaymentType = transaction.PaymentType.ToString(),
            Reccurence = transaction.Reccurence.ToString(),
            Description = transaction.Description
        };

        return response;
    }

    public async Task<PagedResponse<TransactionResponseDto>> GetAllTransactionsPagedAsync(int page, int pageSize)
    {
        int offset = (page - 1) * pageSize;

        var transactions = await _context.Transactions.OrderByDescending(t => t.CreatedAt).Skip(offset).Take(pageSize).ToListAsync();
        var totalItems = await _context.Transactions.CountAsync();

        int totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var transactionsDto = transactions.Select(t => new TransactionResponseDto
        {
            Id = t.Id,
            Value = t.Value,
            Category = t.Category,
            Type = t.Type.ToString(),
            TransactionDate = t.TransactionDate,
            PaymentType = t.PaymentType.ToString(),
            Reccurence = t.Reccurence.ToString(),
            Description = t.Description
        });

        PagedResponse<TransactionResponseDto> response = new PagedResponse<TransactionResponseDto>()
        {
            TotalItems = totalItems,
            CurrentPage = page,
            PageSize = pageSize,
            RowCount = transactions.Count(),
            TotalPages = totalPages,
            Items = transactionsDto
        };

        return response;
    }

    public async Task UpdateTransactionAsyncById(UpdateTransactionRequestDto requestDto)
    {
        var transactionToPatch = await _context.Transactions.SingleAsync(t => t.Id == requestDto.TransactionId);

        if (transactionToPatch == null)
            throw new Exception($"Transaction with ID {requestDto.TransactionId} not found");

        transactionToPatch.Value = requestDto.Value;
        transactionToPatch.Type = Enum.Parse<EnumTransactionType>(requestDto.Type);
        transactionToPatch.Category = requestDto.Category;
        transactionToPatch.TransactionDate = requestDto.Date;
        transactionToPatch.PaymentType = Enum.Parse<EnumPaymentType>(requestDto.PaymentType);
        transactionToPatch.Reccurence = Enum.Parse<EnumPaymentRecurrence>(requestDto.Reccurence);
        transactionToPatch.Description = requestDto.Description;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteTransactionById(int transactionId)
    {
        var transaction = await _context.Transactions.SingleAsync(t => t.Id == transactionId);

        if(transaction == null)
            throw new Exception($"Transaction with ID: {transactionId} not found");

        _context.Remove(transaction);
        await _context.SaveChangesAsync();
    }
}