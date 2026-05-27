using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response.Import;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services;

public interface IImportService
{
    Task<Result<ParseImportFileResponseDto>> ParseFileAsync(Stream fileStream, string fileName, int accountId, int userId);
    Task<Result<int>> ConfirmImportAsync(ImportTransactionsRequestDto requestDto, int userId);
}
