namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>
    /// A tag as the management list shows it. Carries the usage count, which decides
    /// whether the tag can be deleted and tells the user what a rename will touch.
    /// </summary>
    public class GetTagItemResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int TransactionCount { get; set; }
    }
}
