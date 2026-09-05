using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateUserPlanValidator : AbstractValidator<UpdateUserPlanRequestDto>
    {
        public UpdateUserPlanValidator()
        {
            RuleFor(x => x.Plan)
                .IsInEnum().WithMessage("Plan must be Free or Premium.");
        }
    }
}
