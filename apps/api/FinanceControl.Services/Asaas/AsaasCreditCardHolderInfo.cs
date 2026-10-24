namespace FinanceControl.Services.Asaas
{
    public class AsaasCreditCardHolderInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CpfCnpj { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string AddressNumber { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? MobilePhone { get; set; }

        public override string ToString() => "[holder redacted]";
    }
}
