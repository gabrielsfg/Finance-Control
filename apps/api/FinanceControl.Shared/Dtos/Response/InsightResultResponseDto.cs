using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>
    /// An analysis request's outcome. Insight is set when Status is Available — and also
    /// on QuotaExceeded when an earlier analysis of the same week is cached.
    /// </summary>
    public class InsightResultResponseDto
    {
        public EnumAiAvailability Status { get; set; }
        public GetInsightResponseDto? Insight { get; set; }
    }
}
