namespace FinanceControl.Services.Pluggy
{
    public class PluggyConnectTokenOptions
    {
        public string? ClientUserId { get; set; }
        public string? OauthRedirectUri { get; set; }
        public bool? AvoidDuplicates { get; set; }
    }
}
