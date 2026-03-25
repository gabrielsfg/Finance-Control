namespace FinanceControl.Shared.Dtos.Response
{
    public class AreaInBudgetResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<AllocationInBudgetResponseDto> Allocations { get; set; } = [];
    }
}
