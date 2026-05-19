using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class AllocationDto
    {
        public EnumAssetType AssetType { get; set; }
        public string AssetClass { get; set; } = string.Empty;
        public long Value { get; set; }
        public decimal Percent { get; set; }
        public string Color { get; set; } = string.Empty;
    }
}
