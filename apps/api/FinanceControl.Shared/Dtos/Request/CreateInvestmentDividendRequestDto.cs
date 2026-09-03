using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateInvestmentDividendRequestDto
    {
        public int InvestmentId { get; set; }
        public DateOnly? PaymentDate { get; set; }
        public DateOnly? LastDatePrior { get; set; }
        public long Amount { get; set; }
        public EnumDividendType Type { get; set; }
        public int AccountId { get; set; }

        /// <summary>
        /// Whether the payout also lands as income in the chosen account.
        /// </summary>
        /// <remarks>
        /// False when recording a payout already received — the money reached the account
        /// months ago, and a second entry would count it twice. Defaults to true so an
        /// omitted field keeps the original behaviour.
        /// </remarks>
        public bool CreateLinkedTransaction { get; set; } = true;
    }
}
