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

        Task<Result<GetSubscriptionResponseDto>> CancelSubscriptionAsync(int userId, CancellationToken cancellationToken = default);

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
