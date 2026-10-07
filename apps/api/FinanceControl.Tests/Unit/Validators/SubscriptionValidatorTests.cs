using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Helpers;

namespace FinanceControl.Tests.Unit.Validators
{
    public class SubscriptionValidatorTests
    {
        private readonly CreateSubscriptionValidator _validator = new();

        private static CreateSubscriptionRequestDto Valid() => new()
        {
            Plan = EnumSubscriptionPlan.Basic,
            Cycle = EnumBillingCycle.Monthly,
            BillingMethod = EnumBillingMethod.CreditCard,
            Cpf = "529.982.247-25",
            MobilePhone = "(11) 98765-4321",
            PostalCode = "01310-100",
            AddressNumber = "100",
            Card = new SubscriptionCardRequestDto
            {
                HolderName = "Maria Silva",
                Number = "4242 4242 4242 4242",
                ExpiryMonth = "12",
                ExpiryYear = (DateTime.UtcNow.Year + 1).ToString(),
                Cvv = "123"
            }
        };

        [Theory]
        [InlineData("529.982.247-25", true)]
        [InlineData("11144477735", true)]
        [InlineData("52998224724", false)]
        [InlineData("11111111111", false)]
        [InlineData("123", false)]
        public void Cpf_ChecksTheVerifierDigits(string cpf, bool expected) =>
            Assert.Equal(expected, CpfHelper.IsValid(cpf));

        [Fact]
        public void ValidCardRequest_Passes() => Assert.True(_validator.Validate(Valid()).IsValid);

        [Fact]
        public void CardNumber_FailingLuhn_IsRejectedWithoutEchoingIt()
        {
            var request = Valid();
            request.Card!.Number = "4242424242424241";

            var result = _validator.Validate(request);

            Assert.False(result.IsValid);
            Assert.All(result.Errors, e => Assert.DoesNotContain("4242", e.ErrorMessage));
        }

        [Fact]
        public void ExpiredCard_IsRejected()
        {
            var request = Valid();
            request.Card!.ExpiryYear = (DateTime.UtcNow.Year - 1).ToString();
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void CardPayment_WithoutCard_IsRejected()
        {
            var request = Valid();
            request.Card = null;
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void Pix_DoesNotNeedACard()
        {
            var request = Valid();
            request.BillingMethod = EnumBillingMethod.Pix;
            request.Card = null;
            Assert.True(_validator.Validate(request).IsValid);
        }

        [Theory]
        [InlineData(EnumBillingCycle.Yearly, EnumBillingMethod.CreditCard, 12, true)]
        [InlineData(EnumBillingCycle.Yearly, EnumBillingMethod.CreditCard, 13, false)]
        [InlineData(EnumBillingCycle.Monthly, EnumBillingMethod.CreditCard, 3, false)]
        [InlineData(EnumBillingCycle.Yearly, EnumBillingMethod.Pix, 2, false)]
        public void Installments_OnlyForTheYearlyCardPlan(EnumBillingCycle cycle, EnumBillingMethod method, int count, bool expected)
        {
            var request = Valid();
            request.Cycle = cycle;
            request.BillingMethod = method;
            request.InstallmentCount = count;
            if (method != EnumBillingMethod.CreditCard)
                request.Card = null;

            Assert.Equal(expected, _validator.Validate(request).IsValid);
        }
    }
}
