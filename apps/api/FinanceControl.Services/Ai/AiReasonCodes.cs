using System.Net;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The only values ever written to <c>AiGenerationLog.RejectionReason</c>. Fixed codes,
    /// never the matched text, the model output or a provider message: the log is kept for
    /// twelve months and must not become a second copy of the user's data.
    /// </summary>
    public static class AiReasonCodes
    {
        // Guard rejections
        public const string BlockedAdviceTerm = "blocked_advice_term";
        public const string BlockedRecommendationTerm = "blocked_recommendation_term";
        public const string BlockedAdequacyTerm = "blocked_adequacy_term";
        public const string BlockedOutOfScopeTerm = "blocked_out_of_scope_term";
        public const string BlockedTicker = "blocked_ticker";
        public const string FigureNotInSnapshot = "figure_not_in_snapshot";
        public const string DeclaredFigureNotInSnapshot = "declared_figure_not_in_snapshot";
        public const string EmptyHeadline = "empty_headline";
        public const string HeadlineTooLong = "headline_too_long";
        public const string NoParagraphs = "no_paragraphs";
        public const string TooManyParagraphs = "too_many_paragraphs";
        public const string EmptyParagraph = "empty_paragraph";
        public const string ParagraphTooLong = "paragraph_too_long";

        // Model and provider outcomes
        public const string NotConfigured = "not_configured";
        public const string ModelRefusal = "model_refusal";
        public const string EmptyOutput = "empty_output";
        public const string SchemaMismatch = "schema_mismatch";
        public const string ToolIterationLimit = "tool_iteration_limit";
        public const string QuotaExceeded = "quota_exceeded";
        public const string ProviderError = "provider_error";
        public const string ProviderTimeout = "provider_error_timeout";
        public const string ProviderNetwork = "provider_error_network";

        /// <summary>
        /// "provider_error_429", "provider_error_timeout"… — the HTTP status when the
        /// exception carries one, never the exception message.
        /// </summary>
        public static string FromException(Exception exception)
        {
            if (exception is TimeoutException or TaskCanceledException)
                return ProviderTimeout;

            if (exception is HttpRequestException { StatusCode: { } httpStatus })
                return $"{ProviderError}_{(int)httpStatus}";

            // The SDK's API exceptions expose the status as a property; read it without
            // binding to a specific SDK type, so an SDK upgrade cannot break the build.
            var statusValue = exception.GetType().GetProperty("StatusCode")?.GetValue(exception);
            var status = statusValue switch
            {
                HttpStatusCode code => (int)code,
                int code => code,
                _ => (int?)null
            };

            if (status is > 0)
                return $"{ProviderError}_{status}";

            if (exception is HttpRequestException || exception.GetType().Name.Contains("IOException", StringComparison.Ordinal))
                return ProviderNetwork;

            return ProviderError;
        }
    }
}
