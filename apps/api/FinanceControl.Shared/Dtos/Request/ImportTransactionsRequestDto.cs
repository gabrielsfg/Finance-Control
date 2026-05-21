namespace FinanceControl.Shared.Dtos.Request;

public class ImportTransactionsRequestDto
{
    public int AccountId { get; set; }
    public bool CountForBudget { get; set; }
    public List<ImportTransactionItemRequestDto> Transactions { get; set; } = [];
}
