using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations;

public class VerifyEmailValidator : AbstractValidator<VerifyEmailRequestDto>
{
    public VerifyEmailValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address.");

        RuleFor(v => v.Code)
            .NotEmpty().WithMessage("Code is required.")
            .Matches("^[0-9]{6}$").WithMessage("Code must be 6 digits.");
    }
}
