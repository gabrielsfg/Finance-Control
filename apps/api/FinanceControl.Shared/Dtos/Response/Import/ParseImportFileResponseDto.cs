using FinanceControl.Shared.Dtos.Response.Import;

namespace FinanceControl.Shared.Dtos.Response.Import;

public class ParseImportFileResponseDto
{
    public List<ParsedTransactionItemDto> Transactions { get; set; } = [];
    public int TotalFound { get; set; }
    public int DuplicatesFound { get; set; }
}
