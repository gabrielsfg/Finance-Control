using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetAllBudgetResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public EnumBudgetRecurrence Recurrence { get; set; }
    }
}
