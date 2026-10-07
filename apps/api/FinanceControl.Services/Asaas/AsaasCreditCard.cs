namespace FinanceControl.Services.Asaas
{
    /// <summary>Raw card data on its way to Asaas.</summary>
    /// <remarks>
    /// Lives only in memory for the length of one request. <see cref="ToString"/> is
    /// overridden so that an accidental log line, exception message or debugger dump
    /// prints a mask instead of the number.
    /// </remarks>
    public class AsaasCreditCard
    {
        public string HolderName { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string ExpiryMonth { get; set; } = string.Empty;
        public string ExpiryYear { get; set; } = string.Empty;
        public string Ccv { get; set; } = string.Empty;

        public override string ToString() => "[card redacted]";
    }
}
