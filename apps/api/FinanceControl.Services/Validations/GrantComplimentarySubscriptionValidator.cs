using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class GrantComplimentarySubscriptionValidator : AbstractValidator<GrantComplimentarySubscriptionRequestDto>
    {
        public GrantComplimentarySubscriptionValidator()
        {
            RuleFor(x => x.Plan).IsInEnum().WithMessage("Plan must be Basic or Premium.");
            RuleFor(x => x.Months)
                .InclusiveBetween(1, 36).WithMessage("Months must be between 1 and 36.");
        }
    }
}
