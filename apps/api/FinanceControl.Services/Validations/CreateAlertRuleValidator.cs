using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateAlertRuleValidator : AbstractValidator<CreateAlertRuleRequestDto>
    {
        public CreateAlertRuleValidator()
        {
            RuleFor(r => r.MarketAssetId)
                .GreaterThan(0).WithMessage("MarketAssetId is required.");

            RuleFor(r => r.TargetValue)
                .GreaterThan(0).WithMessage("TargetValue must be greater than zero.");
        }
    }
}
