namespace FinanceControl.Services.Billing
{
    /// <summary>
    /// NFS-e issuing through Asaas, bound from "InvoiceSettings". The service code, the
    /// description and the tax rates come from the accountant and depend on the city where
    /// the company is registered — keep <see cref="Enabled"/> false until they are set and
    /// the city is configured in the Asaas panel (Notas fiscais).
    /// </summary>
    public class InvoiceSettings
    {
        public bool Enabled { get; set; }

        /// The city's service id from Asaas ("Listar serviços municipais"), or the code
        /// (LC 116 item, e.g. "1.05") when the city works with codes.
        public string? MunicipalServiceId { get; set; }
        public string? MunicipalServiceCode { get; set; }
        public string MunicipalServiceName { get; set; } = string.Empty;

        public string ServiceDescription { get; set; } = "Assinatura da plataforma Helmo";
        public string Observations { get; set; } = string.Empty;

        /// Rates in percent. Simples Nacional usually leaves everything but ISS at zero.
        public bool RetainIss { get; set; }
        public decimal Iss { get; set; }
        public decimal Pis { get; set; }
        public decimal Cofins { get; set; }
        public decimal Csll { get; set; }
        public decimal Inss { get; set; }
        public decimal Ir { get; set; }

        /// Charges confirmed before this many days ago are not invoiced retroactively when
        /// the feature is switched on.
        public int MaxBackfillDays { get; set; } = 30;
    }
}
