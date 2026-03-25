using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateBudgetRequestDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int StartDate { get; set; }
        public EnumBudgetRecurrence Recurrence { get; set; }
        public bool IsActive { get; set; }
        public List<UpsertAreaInBudgetDto> Areas { get; set; } = [];
    }
}
