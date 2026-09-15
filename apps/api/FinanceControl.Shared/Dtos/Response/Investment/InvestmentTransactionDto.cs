using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class InvestmentTransactionDto
    {
        public int Id { get; set; }
        public int InvestmentId { get; set; }
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumInvestmentOperation Operation { get; set; }
        public DateOnly Date { get; set; }
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long OtherCosts { get; set; }
        public long TotalValue { get; set; }

        /// <summary>Account the cash side of the operation was booked against.</summary>
        public int AccountId { get; set; }

        /// <summary>Whether the operation moved money in that account.</summary>
        public bool HasLinkedTransaction { get; set; }

        /// <summary>Whether that movement counts against the active budget.</summary>
        public bool IncludeInBudget { get; set; }

        /// <summary>Tags on the cash movement.</summary>
        public List<string> Tags { get; set; } = [];
    }
}
