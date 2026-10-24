using FinanceControl.Services.Billing;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class ChangeSubscriptionPlanValidator : AbstractValidator<ChangeSubscriptionPlanRequestDto>
    {
        public ChangeSubscriptionPlanValidator()
        {
            RuleFor(x => x.Plan).IsInEnum().WithMessage("Plan must be Basic or Premium.");
            RuleFor(x => x.Cycle).IsInEnum().WithMessage("Cycle must be Monthly or Yearly.");
            RuleFor(x => x.InstallmentCount)
                .InclusiveBetween(1, BillingCatalog.MaxYearlyInstallments)
                .WithMessage($"InstallmentCount must be between 1 and {BillingCatalog.MaxYearlyInstallments}.");
        }
    }
}
