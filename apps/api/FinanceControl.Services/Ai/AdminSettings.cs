namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Who may call the administrative endpoints, bound from the "AdminSettings" section.
    /// </summary>
    /// <remarks>
    /// There is no role system in the application yet, and the plan toggle hands out a paid
    /// feature — without a gate, any authenticated user could upgrade themselves. An empty
    /// list denies everyone, so a deployment that forgets to configure it fails closed.
    /// <para>
    /// This is a stopgap for the provisional plan endpoint. When the payment gateway owns
    /// the plan field, the endpoint and this class go away together.
    /// </para>
    /// </remarks>
    public class AdminSettings
    {
        public int[] AllowedUserIds { get; set; } = [];

        public bool IsAdmin(int userId) => AllowedUserIds.Contains(userId);
    }
}
