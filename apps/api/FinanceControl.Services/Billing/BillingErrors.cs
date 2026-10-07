namespace FinanceControl.Services.Billing
{
    /// <summary>
    /// Error codes the subscription endpoints answer with. The clients map each one to
    /// their own copy, so these are stable identifiers, not sentences.
    /// </summary>
    public static class BillingErrors
    {
        public const string AlreadySubscribed = "ALREADY_SUBSCRIBED";
        public const string NoSubscription = "NO_SUBSCRIPTION";
        public const string CardDeclined = "CARD_DECLINED";
        public const string CardAttemptsExceeded = "CARD_ATTEMPTS_EXCEEDED";
        public const string CaptchaFailed = "CAPTCHA_FAILED";
        public const string GatewayUnavailable = "GATEWAY_UNAVAILABLE";
        public const string GatewayRejected = "GATEWAY_REJECTED";
        public const string NotRefundable = "NOT_REFUNDABLE";
        public const string NotResumable = "NOT_RESUMABLE";
        public const string NotCancelable = "NOT_CANCELABLE";
        public const string PlanChangeNotAllowed = "PLAN_CHANGE_NOT_ALLOWED";
        public const string NothingToChange = "NOTHING_TO_CHANGE";
        public const string NotPaidByCard = "NOT_PAID_BY_CARD";
        public const string NoPendingPix = "NO_PENDING_PIX";
        public const string UserNotFound = "USER_NOT_FOUND";
    }
}
