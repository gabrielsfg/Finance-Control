namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Who may call the administrative endpoints, bound from the "AdminSettings" section.
    /// </summary>
    /// <remarks>
    /// There is no role system in the application yet, and the admin endpoints hand out a
    /// paid plan (complimentary subscriptions) — without a gate, any authenticated user could
    /// give themselves one. An empty list denies everyone, so a deployment that forgets to
    /// configure it fails closed.
    /// </remarks>
    public class AdminSettings
    {
        public int[] AllowedUserIds { get; set; } = [];

        public bool IsAdmin(int userId) => AllowedUserIds.Contains(userId);
    }
}
