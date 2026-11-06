namespace FinanceControl.Shared.Dtos.Request
{
    /// <summary>
    /// The exact versions the user was shown and accepted. Naming them, instead of
    /// "accept whatever is current", keeps a version published between the screen
    /// loading and the click from being signed unseen.
    /// </summary>
    public class AcceptLegalDocumentsRequestDto
    {
        public List<AcceptLegalDocumentItemRequestDto> Documents { get; set; } = [];
    }
}
