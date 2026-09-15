using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateTagValidator : AbstractValidator<UpdateTagRequestDto>
    {
        public UpdateTagValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(50).WithMessage("Name must be at most 50 characters.");
        }
    }
}
