using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Ai
{
    public record ImportCategorySuggestion(int? SubCategoryId, EnumCategorizationSource Source)
    {
        public static readonly ImportCategorySuggestion Empty = new(null, EnumCategorizationSource.None);
    }
}
