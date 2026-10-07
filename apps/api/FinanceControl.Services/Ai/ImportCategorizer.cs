using System.Diagnostics;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Helpers;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Suggests a subcategory for each imported row: the user's own history first, Claude
    /// only for what the history cannot place.
    /// </summary>
    /// <remarks>
    /// The history pass is free, deterministic and works on every plan. The model pass
    /// runs only when <see cref="AiAccessPolicy"/> allows it (Premium, AI switched on,
    /// integration enabled) and sends the least it can: a sanitized description, the
    /// value and the direction — no date, no account.
    /// </remarks>
    public class ImportCategorizer
    {
        private readonly ApplicationDbContext _context;
        private readonly ClaudeClient _client;
        private readonly AiAccessPolicy _accessPolicy;
        private readonly AnthropicSettings _settings;
        private readonly ILogger<ImportCategorizer> _logger;

        public ImportCategorizer(
            ApplicationDbContext context,
            ClaudeClient client,
            AiAccessPolicy accessPolicy,
            IOptions<AnthropicSettings> settings,
            ILogger<ImportCategorizer> logger)
        {
            _context = context;
            _client = client;
            _accessPolicy = accessPolicy;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<List<ImportCategorySuggestion>> SuggestAsync(
            IReadOnlyList<ImportCategorizationInput> rows,
            int userId,
            CancellationToken cancellationToken = default)
        {
            var subcategories = await _context.SubCategories
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => new { s.Id, s.Name, Category = s.Category.Name })
                .ToListAsync(cancellationToken);

            var validIds = subcategories.Select(s => s.Id).ToHashSet();
            var history = await BuildHistoryAsync(userId, cancellationToken);

            var suggestions = rows
                .Select(row => MatchHistory(row, history, validIds))
                .ToList();

            var unmatched = suggestions
                .Select((suggestion, index) => (suggestion, index))
                .Where(pair => pair.suggestion.SubCategoryId is null)
                .Select(pair => pair.index)
                .Take(_settings.MaxImportRowsForAi)
                .ToList();

            if (unmatched.Count == 0 || subcategories.Count == 0)
                return suggestions;

            // Entitlement before anything is serialized for the model.
            if (await _accessPolicy.CheckAsync(userId) != EnumAiAvailability.Available)
                return suggestions;

            var subcategoryList = string.Join('\n', subcategories.Select(s =>
                $"{s.Id}: {AiPayloadSanitizer.ScrubText(s.Category)} > {AiPayloadSanitizer.ScrubText(s.Name)}"));

            var rowList = string.Join('\n', unmatched.Select(index =>
            {
                var row = rows[index];
                var direction = row.Type == EnumTransactionType.Income ? "entrada" : "saida";
                return $"{index}|{AiPayloadSanitizer.ScrubText(row.Description)}|{row.Value}|{direction}";
            }));

            var userContent = $"""
                Subcategorias disponíveis (id: categoria > subcategoria):
                {subcategoryList}

                Transações (índice|descrição|valor em centavos|direção):
                {rowList}
                """;

            var stopwatch = Stopwatch.StartNew();
            var result = await _client.GenerateStructuredAsync<ImportCategorizationOutput>(
                _settings.ImportModel,
                ImportCategorizationPrompt.System,
                userContent,
                ImportCategorizationPrompt.OutputSchemaJson,
                maxTokens: 8000,
                cancellationToken);
            stopwatch.Stop();

            _context.AiGenerationLogs.Add(new AiGenerationLog
            {
                UserId = userId,
                Feature = EnumAiFeature.ImportCategorization,
                Outcome = result.Output is null ? EnumAiOutcome.ApiError : EnumAiOutcome.Delivered,
                Model = _settings.ImportModel,
                InputTokens = result.InputTokens,
                OutputTokens = result.OutputTokens,
                CachedInputTokens = result.CachedInputTokens,
                DurationMs = (int)stopwatch.ElapsedMilliseconds,
                RejectionReason = result.Error is null || result.Error.Length <= 300 ? result.Error : result.Error[..300]
            });
            await _context.SaveChangesAsync(cancellationToken);

            if (result.Output is null)
            {
                _logger.LogWarning("Import categorization by AI failed for user {UserId}: {Error}", userId, result.Error);
                return suggestions;
            }

            var unmatchedSet = unmatched.ToHashSet();
            foreach (var item in result.Output.Items)
            {
                // The model may only fill rows it was given, and only with ids that exist.
                if (!unmatchedSet.Contains(item.Index) || item.SubcategoryId is not { } id || !validIds.Contains(id))
                    continue;

                suggestions[item.Index] = new ImportCategorySuggestion(id, EnumCategorizationSource.Ai);
            }

            return suggestions;
        }

        /// <summary>
        /// Match key → the subcategory the user chose most often for it, over the last two
        /// years. Frequency beats recency: one miscategorised row should not flip a
        /// merchant the user has filed the same way fifty times.
        /// </summary>
        private async Task<HistoryIndex> BuildHistoryAsync(int userId, CancellationToken cancellationToken)
        {
            var since = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-2);

            var past = await _context.Transactions
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.TransactionDate >= since && t.SubCategoryId > 0)
                .Select(t => new { t.Description, t.SubCategoryId, t.Type })
                .ToListAsync(cancellationToken);

            var exact = new Dictionary<string, Dictionary<int, int>>();
            var prefix = new Dictionary<string, Dictionary<int, int>>();

            foreach (var transaction in past)
            {
                var key = ImportDescriptionHelper.ToMatchKey(transaction.Description);
                if (key.Length < 3)
                    continue;

                Count(exact, $"{transaction.Type}:{key}", transaction.SubCategoryId);
                Count(prefix, $"{transaction.Type}:{ImportDescriptionHelper.ToPrefixKey(key)}", transaction.SubCategoryId);
            }

            return new HistoryIndex(Resolve(exact), Resolve(prefix));

            static void Count(Dictionary<string, Dictionary<int, int>> index, string key, int subcategoryId)
            {
                if (!index.TryGetValue(key, out var counts))
                    index[key] = counts = [];
                counts[subcategoryId] = counts.GetValueOrDefault(subcategoryId) + 1;
            }

            static Dictionary<string, int> Resolve(Dictionary<string, Dictionary<int, int>> index) =>
                index.ToDictionary(p => p.Key, p => p.Value.MaxBy(c => c.Value).Key);
        }

        private static ImportCategorySuggestion MatchHistory(
            ImportCategorizationInput row,
            HistoryIndex history,
            HashSet<int> validIds)
        {
            var key = ImportDescriptionHelper.ToMatchKey(row.Description);
            if (key.Length < 3)
                return ImportCategorySuggestion.Empty;

            if (history.Exact.TryGetValue($"{row.Type}:{key}", out var id) && validIds.Contains(id))
                return new ImportCategorySuggestion(id, EnumCategorizationSource.History);

            var prefixKey = ImportDescriptionHelper.ToPrefixKey(key);
            if (prefixKey.Length >= 5
                && history.Prefix.TryGetValue($"{row.Type}:{prefixKey}", out id)
                && validIds.Contains(id))
                return new ImportCategorySuggestion(id, EnumCategorizationSource.History);

            return ImportCategorySuggestion.Empty;
        }

        private record HistoryIndex(Dictionary<string, int> Exact, Dictionary<string, int> Prefix);
    }
}
