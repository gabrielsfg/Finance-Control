using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class GrantComplimentarySubscriptionRequestDto
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public int Months { get; set; }
    }
}
