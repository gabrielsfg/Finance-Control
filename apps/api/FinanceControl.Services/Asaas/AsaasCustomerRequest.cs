namespace FinanceControl.Services.Asaas
{
    public class AsaasCustomerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string CpfCnpj { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? MobilePhone { get; set; }
        public string? PostalCode { get; set; }
        public string? AddressNumber { get; set; }
        public string? ExternalReference { get; set; }

        /// Turns off every email, SMS and phone call Asaas would send this customer.
        /// We send our own, and two sets of reminders for one charge read like a scam.
        public bool NotificationDisabled { get; set; } = true;
    }
}
