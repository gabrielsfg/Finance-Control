using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateSubscriptionCardValidator : AbstractValidator<UpdateSubscriptionCardRequestDto>
    {
        public UpdateSubscriptionCardValidator()
        {
            RuleFor(x => x.Cpf).Must(BillingHolderRules.IsValidCpf).WithMessage("CPF is invalid.");
            RuleFor(x => x.MobilePhone).Must(BillingHolderRules.IsValidMobilePhone).WithMessage("Mobile phone is invalid.");
            RuleFor(x => x.PostalCode).Must(BillingHolderRules.IsValidPostalCode).WithMessage("Postal code is invalid.");
            RuleFor(x => x.AddressNumber)
                .NotEmpty().WithMessage("Address number is required.")
                .MaximumLength(20).WithMessage("Address number must be at most 20 characters.");

            RuleFor(x => x.Card)
                .NotNull().WithMessage("Card is required.")
                .SetValidator(new SubscriptionCardValidator());
        }
    }
}
