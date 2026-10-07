using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Request
{
    public class CreateSubscriptionRequestDto
    {
        public EnumSubscriptionPlan Plan { get; set; }
        public EnumBillingCycle Cycle { get; set; }
        public EnumBillingMethod BillingMethod { get; set; }

        /// Yearly card only, 1 to 12. Ignored otherwise.
        public int InstallmentCount { get; set; } = 1;

        /// The subscriber's CPF — also the card holder's when paying by card. Masked or not.
        public string Cpf { get; set; } = string.Empty;
        public string MobilePhone { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string AddressNumber { get; set; } = string.Empty;

        /// Required when BillingMethod is CreditCard.
        public SubscriptionCardRequestDto? Card { get; set; }

        /// Cloudflare Turnstile token from the form.
        public string? CaptchaToken { get; set; }

        public override string ToString() => $"CreateSubscription({Plan}, {Cycle}, {BillingMethod})";
    }
}
