namespace FinanceControl.Shared.Dtos.Request
{
    public class UpsertAreaInBudgetDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public List<UpsertAllocationInBudgetDto> Allocations { get; set; } = [];
    }
}
