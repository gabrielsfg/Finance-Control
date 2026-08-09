namespace FinanceControl.Shared.Dtos.Response.Export
{
    public class ExportUserProfileDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? EmailVerifiedAt { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public string PreferredCurrency { get; set; } = string.Empty;
        public string PreferredLanguage { get; set; } = string.Empty;
        public string? Country { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
