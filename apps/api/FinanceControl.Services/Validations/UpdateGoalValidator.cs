using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateGoalValidator : AbstractValidator<UpdateGoalRequestDto>
    {
        public UpdateGoalValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name must not be empty.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
                .When(x => x.Name is not null);

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.")
                .When(x => x.Description is not null);

            RuleFor(x => x.TargetAmount)
                .GreaterThan(0).WithMessage("TargetAmount must be greater than zero.")
                .When(x => x.TargetAmount.HasValue);

            RuleFor(x => x.Color)
                .Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a valid hex color (e.g. #4A9EFF).")
                .When(x => x.Color is not null);

            RuleFor(x => x.Url)
                .MaximumLength(500).WithMessage("Url must not exceed 500 characters.")
                .When(x => x.Url is not null);

            RuleFor(x => x.ImageUrl)
                .MaximumLength(500).WithMessage("ImageUrl must not exceed 500 characters.")
                .When(x => x.ImageUrl is not null);
        }
    }
}
