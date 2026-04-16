using FinanceControl.Domain.Common;

namespace FinanceControl.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Name { get; set; }
        public Boolean IsActive { get; set; } = true;
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiresAt { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockoutEnd { get; set; }
        public string PreferredCurrency { get; set; } = "BRL";
        public string PreferredLanguage { get; set; } = "pt-BR";
        public string? Country { get; set; }
    }
}
