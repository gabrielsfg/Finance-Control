using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateBudgetRequestDto
    {
        public string Name { get; set; }
        public int StartDate { get; set; }
        public EnumBudgetRecurrence Recurrence { get; set; }
        public bool IsActive { get; set; }
        public List<CreateAreaInBudgetDto> Areas { get; set; } = [];
    }
}
