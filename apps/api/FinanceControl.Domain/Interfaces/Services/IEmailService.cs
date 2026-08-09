namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends one transactional email.
        /// </summary>
        /// <returns>
        /// Whether the provider accepted it. Callers must not surface this to the user:
        /// telling a visitor that delivery failed for a given address also tells them the
        /// address exists here. Log it and answer the same way either way.
        /// </returns>
        Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
    }
}
