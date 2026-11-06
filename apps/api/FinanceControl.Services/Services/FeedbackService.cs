using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Services.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly ApplicationDbContext _context;

        /// The only values the column is meant to hold. Anything else a client
        /// sends is dropped rather than stored, so the field stays groupable.
        private static readonly string[] KnownSources = ["web", "mobile"];

        /// Stored as the title of an AI content report when the client sends none.
        private const string AiContentDefaultTitle = "AI content report";

        public FeedbackService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<GetFeedbackResponseDto>> CreateFeedbackAsync(
            CreateFeedbackRequestDto requestDto,
            int userId)
        {
            var isAiContent = requestDto.Type == EnumFeedbackType.AiContent;

            var title = requestDto.Title?.Trim() ?? string.Empty;
            if (title.Length == 0)
            {
                if (!isAiContent)
                    return Result<GetFeedbackResponseDto>.Failure("Title is required.");
                title = AiContentDefaultTitle;
            }

            int? aiMessageId = null;
            int? aiInsightId = null;
            if (isAiContent)
            {
                // The reported item must be the user's own: an assistant answer or a stored analysis.
                if (requestDto.AiMessageId is { } messageId)
                {
                    var exists = await _context.AiMessages.AnyAsync(m =>
                        m.UserId == userId && m.Id == messageId && m.Role == EnumAiMessageRole.Assistant);
                    if (!exists)
                        return Result<GetFeedbackResponseDto>.Failure("AI message not found.");
                    aiMessageId = messageId;
                }
                else if (requestDto.AiInsightId is { } insightId)
                {
                    var exists = await _context.UserInsights.AnyAsync(i => i.UserId == userId && i.Id == insightId);
                    if (!exists)
                        return Result<GetFeedbackResponseDto>.Failure("AI insight not found.");
                    aiInsightId = insightId;
                }
                else
                {
                    return Result<GetFeedbackResponseDto>.Failure("The reported AI content is required.");
                }
            }

            var description = requestDto.Description?.Trim();
            var source = requestDto.Source?.Trim().ToLowerInvariant();

            var feedback = new UserFeedback
            {
                UserId = userId,
                Type = requestDto.Type,
                Title = title,
                Description = string.IsNullOrEmpty(description) ? null : description,
                Status = EnumFeedbackStatus.New,
                Source = source is not null && KnownSources.Contains(source) ? source : null,
                AiMessageId = aiMessageId,
                AiInsightId = aiInsightId
            };

            _context.UserFeedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Result<GetFeedbackResponseDto>.Success(new GetFeedbackResponseDto
            {
                Id = feedback.Id,
                Type = feedback.Type,
                Title = feedback.Title,
                Description = feedback.Description,
                Status = feedback.Status,
                AiMessageId = feedback.AiMessageId,
                AiInsightId = feedback.AiInsightId,
                CreatedAt = feedback.CreatedAt
            });
        }
    }
}
