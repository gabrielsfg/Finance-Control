namespace FinanceControl.Shared.Dtos.Response
{
    public class GetSubscriptionPlansResponseDto
    {
        public int TrialDays { get; set; }

        /// Whether this account could still start a trial with a card. The CPF rule is only
        /// known at signup, so a true here can still turn into a charge-today there.
        public bool IsTrialEligible { get; set; }

        public List<SubscriptionPlanOptionResponseDto> Options { get; set; } = [];
    }
}
