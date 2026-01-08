namespace FinanceControl.Shared.Dtos.Request;

public class UpdateTransactionRequestDto
{
    public int TransactionId { get; set; }
    public string Type { get; set; }
    public int Value { get; set; }
    public int Category {  get; set; }
    public string? Description { get; set; }
    public DateOnly Date { get; set; }
    public string PaymentType { get; set; }
    public string Reccurence { get; set; }
}