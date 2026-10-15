namespace FinanceControl.Shared.Dtos.Response.OpenFinance
{
    public class OpenFinanceConnectorResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? PrimaryColor { get; set; }
        public bool IsOpenFinance { get; set; }
        public bool IsSandbox { get; set; }

        /// ONLINE, UNSTABLE or OFFLINE.
        public string? HealthStatus { get; set; }
    }
}
