using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Models;

namespace FinanceControl.Services.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly ApplicationDbContext _context;

        /// The only values the column is meant to hold. Anything else a client
        /// sends is dropped rather than stored, so the field stays groupable.
        private static readonly string[] KnownSources = ["web", "mobile"];

        public FeedbackService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<GetFeedbackResponseDto>> CreateFeedbackAsync(
            CreateFeedbackRequestDto requestDto,
            int userId)
        {
            var title = requestDto.Title?.Trim() ?? string.Empty;
            if (title.Length == 0)
                return Result<GetFeedbackResponseDto>.Failure("Title is required.");

            var description = requestDto.Description?.Trim();
            var source = requestDto.Source?.Trim().ToLowerInvariant();

            var feedback = new UserFeedback
            {
                UserId = userId,
                Type = requestDto.Type,
                Title = title,
                Description = string.IsNullOrEmpty(description) ? null : description,
                Status = EnumFeedbackStatus.New,
                Source = source is not null && KnownSources.Contains(source) ? source : null
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
                CreatedAt = feedback.CreatedAt
            });
        }
    }
}
