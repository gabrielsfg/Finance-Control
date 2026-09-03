using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    /// <summary>
    /// Admin-only, provisional: the payment gateway will own this field once it exists.
    /// </summary>
    public class UpdateUserPlanRequestDto
    {
        public EnumUserPlan Plan { get; set; }
    }
}
