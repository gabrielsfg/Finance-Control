using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request;

public class ImportTransactionItemRequestDto
{
    public DateOnly Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Value { get; set; }
    public EnumTransactionType Type { get; set; }
    public int? SubCategoryId { get; set; }

    /// <summary>
    /// Transfers only: the user's other account in the pair. Whether it is the source or
    /// the destination follows <see cref="IsInflow"/> — money that arrived on the imported
    /// statement came from it, money that left went to it.
    /// </summary>
    public int? CounterpartAccountId { get; set; }

    /// <summary>Whether the statement line credited the imported account (positive amount).</summary>
    public bool IsInflow { get; set; }
    public EnumPaymentType PaymentType { get; set; }
    public int? TotalInstallments { get; set; }
    public int? InstallmentNumber { get; set; }

    /// <summary>
    /// Tag names, as typed on the review screen. Names rather than ids for the same
    /// reason the transaction form sends names: the reviewer can invent a tag that does
    /// not exist yet, and resolving it is the server's job.
    /// </summary>
    public List<string>? Tags { get; set; }
}
