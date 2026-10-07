using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    /// <summary>The in-app chat assistant: conversations, messages and the confirmation cards it proposes.</summary>
    public interface IAssistantService
    {
        Task<IReadOnlyList<AiConversationItemResponseDto>> ListConversationsAsync(int userId);

        Task<AiConversationResponseDto?> GetConversationAsync(int conversationId, int userId);

        Task<Result> DeleteConversationAsync(int conversationId, int userId);

        /// <summary>Deletes every conversation of the user. Returns how many.</summary>
        Task<int> DeleteAllConversationsAsync(int userId);

        /// <summary>
        /// Answers one message. The status is checked before anything is sent: a Free
        /// account, an account with the AI switched off or over its monthly quota gets a
        /// status back and nothing is stored.
        /// </summary>
        Task<Result<SendAssistantMessageResponseDto>> SendMessageAsync(
            SendAssistantMessageRequestDto requestDto,
            int userId,
            CancellationToken cancellationToken = default);

        /// <summary>Runs a pending proposal through the regular service, optionally with the user's edits.</summary>
        Task<Result<AiActionResponseDto>> ConfirmActionAsync(int actionId, ConfirmAiActionRequestDto requestDto, int userId);

        Task<Result<AiActionResponseDto>> CancelActionAsync(int actionId, int userId);
    }
}
