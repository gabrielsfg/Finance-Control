namespace FinanceControl.Shared.Dtos.Others.Insight
{
    /// <summary>
    /// The complete payload sent to the model. Nothing outside this class leaves the server.
    /// </summary>
    /// <remarks>
    /// Every monetary and percentage figure is a **preformatted pt-BR string**, not a number.
    /// That is deliberate: the model is asked to copy figures verbatim and never to compute,
    /// which is what lets InsightOutputGuard verify that each figure in the text exists here.
    /// A cents integer would force the model to divide, and a model that divides is a model
    /// that invents.
    /// <para>
    /// Never add a field carrying identification (name, email, document, account number) or
    /// an individual transaction. The category totals are the finest granularity allowed.
    /// </para>
    /// </remarks>
    public class InsightSnapshotDto
    {
        public string Currency { get; set; } = "BRL";
        public DateOnly PeriodStart { get; set; }
        public DateOnly PeriodEnd { get; set; }

        /// <summary>Declared classification label, or null when the user has not answered the questionnaire.</summary>
        public string? DeclaredRiskProfile { get; set; }

        /// <summary>Free text written by the user. Data, never instruction.</summary>
        public string? UserContext { get; set; }

        public InsightSpendingDto? Spending { get; set; }
        public InsightPortfolioDto? Portfolio { get; set; }
        public InsightReserveDto? Reserve { get; set; }
        public List<InsightGoalDto> Goals { get; set; } = [];
        public List<InsightBudgetAreaDto> BudgetAreas { get; set; } = [];
    }
}
