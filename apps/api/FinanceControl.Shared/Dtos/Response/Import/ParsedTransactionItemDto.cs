using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Import;

public class ParsedTransactionItemDto
{
    public string ExternalId { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Value { get; set; }
    public EnumTransactionType Type { get; set; }
    public int? SuggestedSubCategoryId { get; set; }
    public string? SuggestedSubCategoryName { get; set; }
    public EnumPaymentType PaymentType { get; set; }
    public int? TotalInstallments { get; set; }
    public int? InstallmentNumber { get; set; }
    public bool IsDuplicate { get; set; }
    public string? DuplicateReason { get; set; }
}
