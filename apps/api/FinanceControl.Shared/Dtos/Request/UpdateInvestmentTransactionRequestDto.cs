using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    /// <summary>
    /// Edits an operation already registered on a position. The asset itself is not
    /// editable — a trade booked against the wrong ticker is a different position, and
    /// deleting it is the honest way to correct that.
    /// </summary>
    public class UpdateInvestmentTransactionRequestDto
    {
        public EnumInvestmentOperation Operation { get; set; }
        public DateOnly Date { get; set; }
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long OtherCosts { get; set; }
        public int AccountId { get; set; }

        /// <summary>
        /// Whether the operation moves money in the chosen account. Editing rewrites the
        /// linked cash transaction, so turning this off removes the one it had.
        /// </summary>
        public bool CreateLinkedTransaction { get; set; } = true;

        /// <summary>Whether the cash movement counts against the active budget.</summary>
        public bool IncludeInBudget { get; set; } = true;

        /// <summary>Tags for the cash movement.</summary>
        public List<string> Tags { get; set; } = [];
    }
}
