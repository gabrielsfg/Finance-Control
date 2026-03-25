namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateAreaInBudgetDto
    {
        public string Name { get; set; }
        public List<CreateAllocationInBudgetDto> Allocations { get; set; } = [];
    }
}
