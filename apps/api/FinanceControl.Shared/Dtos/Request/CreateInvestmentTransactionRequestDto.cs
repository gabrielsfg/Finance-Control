using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateInvestmentTransactionRequestDto
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public EnumAssetType AssetType { get; set; }
        public string? Broker { get; set; }
        public EnumInvestmentOperation Operation { get; set; }
        public DateOnly Date { get; set; }
        public decimal Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long OtherCosts { get; set; }
        public int AccountId { get; set; }
    }
}
