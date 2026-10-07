using FinanceControl.Services.Billing;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateSubscriptionValidator : AbstractValidator<CreateSubscriptionRequestDto>
    {
        public CreateSubscriptionValidator()
        {
            RuleFor(x => x.Plan).IsInEnum().WithMessage("Plan must be Basic or Premium.");
            RuleFor(x => x.Cycle).IsInEnum().WithMessage("Cycle must be Monthly or Yearly.");
            RuleFor(x => x.BillingMethod).IsInEnum().WithMessage("BillingMethod must be CreditCard, Pix or Boleto.");

            RuleFor(x => x.InstallmentCount)
                .InclusiveBetween(1, BillingCatalog.MaxYearlyInstallments)
                .WithMessage($"InstallmentCount must be between 1 and {BillingCatalog.MaxYearlyInstallments}.");

            RuleFor(x => x.InstallmentCount)
                .Equal(1)
                .When(x => !BillingCatalog.AllowsInstallments(x.Cycle, x.BillingMethod))
                .WithMessage("Only the yearly plan paid by card can be split into installments.");

            RuleFor(x => x.Cpf).Must(BillingHolderRules.IsValidCpf).WithMessage("CPF is invalid.");
            RuleFor(x => x.MobilePhone).Must(BillingHolderRules.IsValidMobilePhone).WithMessage("Mobile phone is invalid.");
            RuleFor(x => x.PostalCode).Must(BillingHolderRules.IsValidPostalCode).WithMessage("Postal code is invalid.");
            RuleFor(x => x.AddressNumber)
                .NotEmpty().WithMessage("Address number is required.")
                .MaximumLength(20).WithMessage("Address number must be at most 20 characters.");

            RuleFor(x => x.Card)
                .NotNull().WithMessage("Card is required for credit card payments.")
                .SetValidator(new SubscriptionCardValidator()!)
                .When(x => x.BillingMethod == EnumBillingMethod.CreditCard);
        }
    }
}
