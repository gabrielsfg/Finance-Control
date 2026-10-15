namespace FinanceControl.Services.Pluggy
{
    public class PluggyCreditCardMetadata
    {
        public int? InstallmentNumber { get; set; }
        public int? TotalInstallments { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public string? BillId { get; set; }
    }
}
