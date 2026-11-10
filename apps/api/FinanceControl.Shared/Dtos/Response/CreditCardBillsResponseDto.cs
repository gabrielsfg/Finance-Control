namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>A card's balance split into bills by its closing and due days.</summary>
    public class CreditCardBillsResponseDto
    {
        /// The bill that already closed and still has something to pay; null once paid.
        public CreditCardBillResponseDto? ClosedBill { get; set; }

        /// The open bill: purchases since the last closing.
        public CreditCardBillResponseDto CurrentBill { get; set; } = new();

        /// Later bills with installments already scheduled, in order.
        public List<CreditCardBillResponseDto> UpcomingBills { get; set; } = [];
    }
}
