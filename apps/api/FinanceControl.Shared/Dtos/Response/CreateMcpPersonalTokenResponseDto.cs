namespace FinanceControl.Shared.Dtos.Response
{
    public class CreateMcpPersonalTokenResponseDto
    {
        /// <summary>The full token. Returned only here, once.</summary>
        public string Token { get; set; } = string.Empty;

        public McpPersonalTokenResponseDto Item { get; set; } = new();
    }
}
