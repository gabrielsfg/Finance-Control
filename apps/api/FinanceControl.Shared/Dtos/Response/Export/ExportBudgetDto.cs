using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportBudgetDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        /// <summary>Stored as the day of month the budget period opens on.</summary>
        public int StartDate { get; set; }

        public EnumBudgetRecurrence Recurrence { get; set; }
        public bool IsActive { get; set; }
        public List<ExportAreaDto> Areas { get; set; } = [];
        public DateTime CreatedAt { get; set; }
    }
}
