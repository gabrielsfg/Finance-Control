namespace FinanceControl.Shared.Dtos.Response
{
    public class CreditCardBillResponseDto
    {
        public DateOnly ClosingDate { get; set; }
        public DateOnly DueDate { get; set; }

        /// What is owed on this bill, in cents (positive).
        public int Amount { get; set; }
    }
}
