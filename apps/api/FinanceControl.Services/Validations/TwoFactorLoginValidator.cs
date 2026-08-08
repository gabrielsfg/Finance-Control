using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations;

public class TwoFactorLoginValidator : AbstractValidator<TwoFactorLoginRequestDto>
{
    public TwoFactorLoginValidator()
    {
        RuleFor(t => t.ChallengeToken)
            .NotEmpty().WithMessage("Challenge token is required.");

        RuleFor(t => t.Code)
            .NotEmpty().WithMessage("Code is required.")
            .Matches("^[0-9]{6}$").WithMessage("Code must be 6 digits.");

        RuleFor(t => t.DeviceName)
            .MaximumLength(120).WithMessage("Device name must be at most 120 characters long.")
            .When(t => t.DeviceName is not null);
    }
}
