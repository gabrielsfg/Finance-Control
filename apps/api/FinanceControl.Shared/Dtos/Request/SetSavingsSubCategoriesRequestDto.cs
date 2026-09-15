namespace FinanceControl.Shared.Dtos.Request
{
    /// <summary>
    /// The complete set of subcategories that count as savings. Ids missing from the list
    /// stop counting — the screen sends the whole checklist, not a delta.
    /// </summary>
    public class SetSavingsSubCategoriesRequestDto
    {
        public List<int> SubCategoryIds { get; set; } = [];
    }
}
