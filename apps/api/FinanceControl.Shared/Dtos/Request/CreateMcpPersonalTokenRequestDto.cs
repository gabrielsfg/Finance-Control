namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateMcpPersonalTokenRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Scopes { get; set; } = [];
        public int ExpiresInDays { get; set; } = 30;
    }
}
