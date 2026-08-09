namespace FinanceControl.Services.Email
{
    public class EmailSettings
    {
        /// <summary>Resend API key (`re_...`). Empty disables delivery — see <c>EmailService</c>.</summary>
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>Sender address. Its domain must be verified in Resend before it will send.</summary>
        public string FromEmail { get; set; } = string.Empty;

        public string FromName { get; set; } = "Quantia";

        public string ApiBaseUrl { get; set; } = "https://api.resend.com/";
    }
}
