using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
using FinanceControl.Shared.Models;

namespace FinanceControl.Domain.Interfaces.Services
{
    /// <summary>
    /// The user-facing side of billing. Failures carry a code from BillingErrors in
    /// <see cref="Result{T}.Error"/>, which the clients translate.
    /// </summary>
    public interface ISubscriptionService
    {
        Task<GetSubscriptionPlansResponseDto> GetPlansAsync(int userId);

        Task<GetSubscriptionResponseDto> GetSubscriptionAsync(int userId);

        /// <param name="remoteIp">The payer's IP, forwarded to Asaas for fraud scoring.</param>
        Task<Result<GetSubscriptionResponseDto>> CreateSubscriptionAsync(
            CreateSubscriptionRequestDto requestDto, int userId, string? remoteIp, CancellationToken cancellationToken = default);

        /// What canceling now would do (refund, fee, access end), for the confirmation dialog.
        Task<Result<SubscriptionCancellationPreviewResponseDto>> GetCancellationPreviewAsync(
            int userId, CancellationToken cancellationToken = default);

        Task<Result<GetSubscriptionResponseDto>> CancelSubscriptionAsync(int userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Ends the subscription of an account about to be deleted, under the same rules as
        /// a cancellation: a yearly plan is refunded (in full inside the withdrawal window,
        /// the unused months minus the fee after it). Fails — and the deletion must stop —
        /// when the refund cannot be made.
        /// </summary>
        Task<Result> TerminateForAccountDeletionAsync(int userId, CancellationToken cancellationToken = default);

        Task<Result<GetSubscriptionResponseDto>> ResumeSubscriptionAsync(int userId, CancellationToken cancellationToken = default);

        Task<Result<GetSubscriptionResponseDto>> RequestRefundAsync(int userId, CancellationToken cancellationToken = default);

        Task<Result<ChangeSubscriptionPlanResponseDto>> ChangePlanAsync(
            ChangeSubscriptionPlanRequestDto requestDto, int userId, CancellationToken cancellationToken = default);

        Task<Result<GetSubscriptionResponseDto>> UpdateCardAsync(
            UpdateSubscriptionCardRequestDto requestDto, int userId, string? remoteIp, CancellationToken cancellationToken = default);

        Task<Result<SubscriptionPixQrCodeResponseDto>> GetPendingPixQrCodeAsync(int userId, CancellationToken cancellationToken = default);

        /// Admin only (the caller checks): a free subscription with no gateway behind it.
        Task<Result<GetSubscriptionResponseDto>> GrantComplimentaryAsync(
            GrantComplimentarySubscriptionRequestDto requestDto, int targetUserId);
    }
}
