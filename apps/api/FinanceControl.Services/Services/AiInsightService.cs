using System.Diagnostics;
using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Ai;
using FinanceControl.Shared.Dtos.Others.Insight;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Services
{
    /// <summary>
    /// Orchestrates one analysis: entitlement, cache, quota, generation, guard, log.
    /// </summary>
    /// <remarks>
    /// The order of the checks is a requirement, not a style choice. The plan check comes
    /// first and returns before a snapshot is built, so a Free account's data never reaches
    /// the point where it could be serialised, let alone sent. AiInsightServiceTests pins
    /// that ordering.
    /// </remarks>
    public class AiInsightService : IAiInsightService
    {
        private readonly ApplicationDbContext _context;
        private readonly InsightSnapshotBuilder _snapshotBuilder;
        private readonly AnthropicInsightClient _client;
        private readonly AnthropicSettings _settings;
        private readonly ILogger<AiInsightService> _logger;

        private static readonly JsonSerializerOptions SnapshotSerializerOptions = new()
        {
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false
        };

        public AiInsightService(
            ApplicationDbContext context,
            InsightSnapshotBuilder snapshotBuilder,
            AnthropicInsightClient client,
            IOptions<AnthropicSettings> settings,
            ILogger<AiInsightService> logger)
        {
            _context = context;
            _snapshotBuilder = snapshotBuilder;
            _client = client;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<GetInsightResponseDto?> GetInsightAsync(
            EnumInsightKind kind,
            int userId,
            bool forceRefresh = false)
        {
            var plan = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.Plan)
                .FirstOrDefaultAsync();

            if (plan != EnumUserPlan.Premium)
                return null;

            if (!_client.IsConfigured)
                return null;

            var weekStart = GetWeekStart(DateOnly.FromDateTime(DateTime.UtcNow));

            var cached = await _context.UserInsights
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.UserId == userId && i.Kind == kind && i.PeriodStart == weekStart);

            if (cached is not null && !forceRefresh)
                return ToResponse(cached);

            if (await IsQuotaExceededAsync(kind, userId))
            {
                await LogAsync(userId, kind, EnumAiOutcome.QuotaExceeded, null, 0, "Monthly quota reached.");

                // The cached analysis, when there is one, beats an empty card.
                return cached is not null ? ToResponse(cached) : null;
            }

            var snapshot = kind == EnumInsightKind.SpendingWeekly
                ? await _snapshotBuilder.BuildSpendingSnapshotAsync(userId, weekStart)
                : await _snapshotBuilder.BuildPortfolioSnapshotAsync(userId, weekStart, _settings.MaxPriceAgeDays);

            if (snapshot is null)
            {
                await LogAsync(userId, kind, EnumAiOutcome.NotEnoughData, null, 0, null);
                return null;
            }

            var snapshotJson = JsonSerializer.Serialize(snapshot, SnapshotSerializerOptions);

            var stopwatch = Stopwatch.StartNew();
            var generation = await _client.GenerateAsync(snapshotJson);
            stopwatch.Stop();

            var output = generation.Output;
            var isFallback = false;

            if (output is null)
            {
                await LogAsync(userId, kind, EnumAiOutcome.ApiError, generation, (int)stopwatch.ElapsedMilliseconds, generation.Error);
                output = Fallback(kind, snapshot);
                isFallback = true;
            }
            else
            {
                var ownedTickers = await _snapshotBuilder.GetOwnedTickersAsync(userId);
                var verdict = InsightOutputGuard.Inspect(output, snapshotJson, ownedTickers);

                if (!verdict.IsApproved)
                {
                    // Worth a warning rather than information: a rejection means either the
                    // model drifted or the prompt was weakened, and both need a human.
                    _logger.LogWarning(
                        "Insight rejected by the guard for user {UserId}, kind {Kind}: {Reason}",
                        userId, kind, verdict.Reason);

                    await LogAsync(userId, kind, EnumAiOutcome.GuardRejected, generation, (int)stopwatch.ElapsedMilliseconds, verdict.Reason);
                    output = Fallback(kind, snapshot);
                    isFallback = true;
                }
            }

            if (!isFallback)
            {
                await LogAsync(userId, kind, EnumAiOutcome.Delivered, generation, (int)stopwatch.ElapsedMilliseconds, null);
                var stored = await StoreAsync(userId, kind, weekStart, snapshotJson, output, generation, cached);
                return ToResponse(stored);
            }

            // Fallback text is never stored: it is cheap to rebuild, and caching it would
            // hide a bad week behind a card that looks generated.
            return new GetInsightResponseDto
            {
                Kind = kind,
                PeriodStart = weekStart,
                Headline = output.Headline,
                Paragraphs = output.Paragraphs.Select(p => new InsightParagraphResponseDto { Text = p.Text }).ToList(),
                GeneratedAt = DateTime.UtcNow,
                IsFallback = true,
                GeneratedByAi = false
            };
        }

        public async Task<GetAiContextResponseDto?> GetContextAsync(int userId)
        {
            var monthStart = GetMonthStart();

            var context = await _context.UserAiContexts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId && c.PeriodStart == monthStart);

            return context is null
                ? null
                : new GetAiContextResponseDto
                {
                    PeriodStart = context.PeriodStart,
                    Text = context.Text,
                    UpdatedAt = context.UpdatedAt
                };
        }

        public async Task<GetAiContextResponseDto> UpsertContextAsync(
            UpsertAiContextRequestDto requestDto,
            int userId)
        {
            var monthStart = GetMonthStart();

            var context = await _context.UserAiContexts
                .FirstOrDefaultAsync(c => c.UserId == userId && c.PeriodStart == monthStart);

            if (context is null)
            {
                context = new UserAiContext { UserId = userId, PeriodStart = monthStart };
                _context.UserAiContexts.Add(context);
            }

            context.Text = requestDto.Text.Trim();
            await _context.SaveChangesAsync();

            return new GetAiContextResponseDto
            {
                PeriodStart = context.PeriodStart,
                Text = context.Text,
                UpdatedAt = context.UpdatedAt
            };
        }

        private async Task<UserInsight> StoreAsync(
            int userId,
            EnumInsightKind kind,
            DateOnly weekStart,
            string snapshotJson,
            InsightModelOutputDto output,
            InsightGenerationResult generation,
            UserInsight? existing)
        {
            var entity = existing is null
                ? new UserInsight { UserId = userId, Kind = kind, PeriodStart = weekStart }
                : await _context.UserInsights.FirstAsync(i => i.Id == existing.Id);

            if (existing is null)
                _context.UserInsights.Add(entity);

            entity.Content = JsonSerializer.Serialize(output, SnapshotSerializerOptions);
            entity.Snapshot = snapshotJson;
            entity.Model = _settings.AnalysisModel;
            entity.InputTokens = generation.InputTokens;
            entity.OutputTokens = generation.OutputTokens;
            entity.CachedInputTokens = generation.CachedInputTokens;
            entity.GeneratedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return entity;
        }

        private async Task<bool> IsQuotaExceededAsync(EnumInsightKind kind, int userId)
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var used = await _context.AiGenerationLogs
                .AsNoTracking()
                .Where(l => l.UserId == userId && l.Kind == kind && l.CreatedAt >= monthStart)
                .Where(l => l.Outcome == EnumAiOutcome.Delivered || l.Outcome == EnumAiOutcome.GuardRejected)
                .CountAsync();

            var limit = kind == EnumInsightKind.SpendingWeekly
                ? _settings.MonthlySpendingInsightsPerUser
                : _settings.MonthlyPortfolioInsightsPerUser;

            return used >= limit;
        }

        private async Task LogAsync(
            int userId,
            EnumInsightKind kind,
            EnumAiOutcome outcome,
            InsightGenerationResult? generation,
            int durationMs,
            string? reason)
        {
            _context.AiGenerationLogs.Add(new AiGenerationLog
            {
                UserId = userId,
                Kind = kind,
                Outcome = outcome,
                Model = _settings.AnalysisModel,
                InputTokens = generation?.InputTokens ?? 0,
                OutputTokens = generation?.OutputTokens ?? 0,
                CachedInputTokens = generation?.CachedInputTokens ?? 0,
                DurationMs = durationMs,
                RejectionReason = reason is null || reason.Length <= 300 ? reason : reason[..300]
            });

            await _context.SaveChangesAsync();
        }

        private static InsightModelOutputDto Fallback(EnumInsightKind kind, InsightSnapshotDto snapshot) =>
            kind == EnumInsightKind.SpendingWeekly
                ? InsightFallbackWriter.WriteSpending(snapshot)
                : InsightFallbackWriter.WritePortfolio(snapshot);

        private static GetInsightResponseDto ToResponse(UserInsight insight)
        {
            var content = JsonSerializer.Deserialize<InsightModelOutputDto>(
                insight.Content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new InsightModelOutputDto();

            return new GetInsightResponseDto
            {
                Kind = insight.Kind,
                PeriodStart = insight.PeriodStart,
                Headline = content.Headline,
                Paragraphs = content.Paragraphs
                    .Select(p => new InsightParagraphResponseDto { Text = p.Text })
                    .ToList(),
                GeneratedAt = insight.GeneratedAt,
                IsFallback = false,
                GeneratedByAi = true
            };
        }

        /// <summary>Monday of the ISO week, in UTC — matching how the rest of the app stores dates.</summary>
        private static DateOnly GetWeekStart(DateOnly date)
        {
            var offset = ((int)date.DayOfWeek + 6) % 7;
            return date.AddDays(-offset);
        }

        private static DateOnly GetMonthStart()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            return new DateOnly(today.Year, today.Month, 1);
        }
    }
}
