using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Domain.Interfaces.Services
{
    public interface IAiInsightService
    {
        /// <summary>
        /// The cached analysis for the current period, generating it on first access. The
        /// status says why there is nothing to show — free plan, AI switched off, feature
        /// off, quota spent, or not enough data — so the client renders the right card
        /// instead of inventing one.
        /// </summary>
        Task<InsightResultResponseDto> GetInsightAsync(EnumInsightKind kind, int userId, bool forceRefresh = false);

        /// <summary>Removes every stored analysis of the user, snapshots included. Returns how many.</summary>
        Task<int> DeleteInsightsAsync(int userId);

        Task<GetAiContextResponseDto?> GetContextAsync(int userId);

        Task<GetAiContextResponseDto> UpsertContextAsync(UpsertAiContextRequestDto requestDto, int userId);

        Task<GetAiSettingsResponseDto?> GetSettingsAsync(int userId);

        Task<GetAiSettingsResponseDto?> UpdateSettingsAsync(UpdateAiSettingsRequestDto requestDto, int userId);
    }
}
