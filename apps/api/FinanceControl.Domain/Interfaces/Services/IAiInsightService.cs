using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IAiInsightService
    {
        /// <summary>
        /// The cached analysis for the current period, generating it on first access.
        /// Null means "nothing to show" — free plan, feature off, quota spent, or not
        /// enough data — and the caller answers 204 rather than inventing a card.
        /// </summary>
        Task<GetInsightResponseDto?> GetInsightAsync(EnumInsightKind kind, int userId, bool forceRefresh = false);

        Task<GetAiContextResponseDto?> GetContextAsync(int userId);

        Task<GetAiContextResponseDto> UpsertContextAsync(UpsertAiContextRequestDto requestDto, int userId);
    }
}
