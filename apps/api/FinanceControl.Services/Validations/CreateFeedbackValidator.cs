using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateFeedbackValidator : AbstractValidator<CreateFeedbackRequestDto>
    {
        public CreateFeedbackValidator()
        {
            RuleFor(x => x.Type)
                .IsInEnum().WithMessage("Type must be Bug or Suggestion.");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MinimumLength(3).WithMessage("Title must be at least 3 characters.")
                .MaximumLength(120).WithMessage("Title must be at most 120 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must be at most 2000 characters.");
        }
    }
}
