using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class AcceptLegalDocumentItemRequestDto
    {
        public EnumLegalDocumentType Type { get; set; }
        public int Version { get; set; }
    }
}
