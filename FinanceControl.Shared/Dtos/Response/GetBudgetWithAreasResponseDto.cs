using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetBudgetWithAreasResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly FinishDate { get; set; }
        public EnumBudgetRecurrence Recurrence { get; set; }
        public bool IsActive { get; set; }
        public List<AreaInBudgetResponseDto> Areas { get; set; } = [];
    }
}
