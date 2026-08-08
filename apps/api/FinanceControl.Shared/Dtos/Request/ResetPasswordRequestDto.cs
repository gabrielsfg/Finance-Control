namespace FinanceControl.Shared.Dtos.Request
{
    public class ResetPasswordRequestDto
    {
        public string Email { get; set; }

        /// <summary>The 6-digit code sent by <c>forgot-password</c>.</summary>
        public string Code { get; set; }

        public string NewPassword { get; set; }
    }
}
