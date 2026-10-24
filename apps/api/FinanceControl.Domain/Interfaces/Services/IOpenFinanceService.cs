using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FinanceControl.Shared.Dtos.Response.OpenFinance;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IOpenFinanceService
    {
        Task<OpenFinanceStatusResponseDto> GetStatusAsync(int userId, CancellationToken cancellationToken = default);

        Task<Result<List<OpenFinanceConnectorResponseDto>>> GetConnectorsAsync(int userId, CancellationToken cancellationToken = default);

        Task<Result<ConnectTokenResponseDto>> CreateConnectTokenAsync(int userId, CreateConnectTokenRequestDto requestDto, CancellationToken cancellationToken = default);

        /// Registers the item the widget returned, after checking it was created for this user.
        Task<Result<BankConnectionResponseDto>> RegisterConnectionAsync(int userId, RegisterBankConnectionRequestDto requestDto, CancellationToken cancellationToken = default);

        Task<List<BankConnectionResponseDto>> GetConnectionsAsync(int userId, CancellationToken cancellationToken = default);

        Task<Result<BankConnectionResponseDto>> GetConnectionAsync(int userId, int connectionId, CancellationToken cancellationToken = default);

        /// Decides, per bank account, whether to import into a new account, an existing one or not at all.
        Task<Result<BankConnectionResponseDto>> LinkAccountsAsync(int userId, int connectionId, LinkBankAccountsRequestDto requestDto, CancellationToken cancellationToken = default);

        /// Asks Pluggy to collect from the bank now.
        Task<Result<BankConnectionResponseDto>> SyncNowAsync(int userId, int connectionId, CancellationToken cancellationToken = default);

        /// Deletes the item at Pluggy (revoking the consent) and removes the connection.
        Task<Result<List<BankConnectionResponseDto>>> DisconnectAsync(int userId, int connectionId, bool deleteTransactions, CancellationToken cancellationToken = default);

        /// Adds a balance adjustment so the linked account matches the balance the bank reports.
        Task<Result<BankConnectionResponseDto>> AdjustBalanceAsync(int userId, int connectionId, AdjustBankBalanceRequestDto requestDto, CancellationToken cancellationToken = default);

        /// Deletes every item of the user at Pluggy and their connections here. Called
        /// before the account or its data is wiped; a Pluggy failure is logged, not thrown.
        Task RemoveAllConnectionsAsync(int userId, CancellationToken cancellationToken = default);
    }
}
