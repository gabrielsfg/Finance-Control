using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpsertAiContextValidator : AbstractValidator<UpsertAiContextRequestDto>
    {
        public UpsertAiContextValidator()
        {
            // The cap is a cost control as much as a UI one: this text is resent on every
            // generation for the month it belongs to.
            RuleFor(x => x.Text)
                .NotEmpty().WithMessage("Text is required.")
                .MaximumLength(500).WithMessage("Text must be at most 500 characters.");
        }
    }
}
