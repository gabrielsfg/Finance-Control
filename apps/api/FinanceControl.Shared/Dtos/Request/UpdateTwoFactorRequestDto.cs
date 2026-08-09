namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateTwoFactorRequestDto
    {
        public bool Enabled { get; set; }

        /// <summary>Required both ways: changing a security setting must re-prove the password.</summary>
        public string Password { get; set; }
    }
}
