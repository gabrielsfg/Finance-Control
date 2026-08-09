using FinanceControl.Shared.Dtos.Response.Export;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IDataExportService
    {
        /// <summary>
        /// Everything stored about one account, for the portability right. Returns null
        /// when the user does not exist.
        /// </summary>
        Task<UserDataExportResponseDto?> ExportUserDataAsync(int userId);
    }
}
