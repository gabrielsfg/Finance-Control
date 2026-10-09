namespace FinanceControl.Shared.Dtos.Response
{
    /// <summary>What the "Conexões de IA" screen needs to explain how to connect.</summary>
    public class McpInfoResponseDto
    {
        /// <summary>The URL the user pastes into Claude, ChatGPT, Cursor, Codex...</summary>
        public string ServerUrl { get; set; } = string.Empty;

        public List<McpScopeResponseDto> Scopes { get; set; } = [];
    }
}
