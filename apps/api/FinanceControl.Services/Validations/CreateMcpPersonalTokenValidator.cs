using FinanceControl.Services.Mcp;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateMcpPersonalTokenValidator : AbstractValidator<CreateMcpPersonalTokenRequestDto>
    {
        public CreateMcpPersonalTokenValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(80).WithMessage("Name must be at most 80 characters.");

            RuleFor(x => x.Scopes)
                .NotEmpty().WithMessage("At least one scope is required.");

            RuleForEach(x => x.Scopes)
                .Must(McpScopes.IsKnown)
                .WithMessage($"Scope must be one of: {string.Join(", ", McpScopes.All)}.");

            // The ceiling comes from McpSettings at runtime; 90 is the default and the
            // hard maximum a personal token may live.
            RuleFor(x => x.ExpiresInDays)
                .InclusiveBetween(1, 90).WithMessage("ExpiresInDays must be between 1 and 90.");
        }
    }
}
