namespace FinanceControl.Shared.Dtos.Response
{
    public class McpConsentDecisionResponseDto
    {
        /// <summary>Where the browser goes next: the client's redirect URI with a code or an error.</summary>
        public string RedirectUrl { get; set; } = string.Empty;
    }
}
