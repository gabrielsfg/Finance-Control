using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateConnectTokenValidator : AbstractValidator<CreateConnectTokenRequestDto>
    {
        public CreateConnectTokenValidator()
        {
            RuleFor(x => x.ConnectionId).GreaterThan(0).When(x => x.ConnectionId is not null)
                .WithMessage("ConnectionId must be positive.");
            RuleFor(x => x.Platform)
                .Must(p => p is null || p.Equals("web", StringComparison.OrdinalIgnoreCase) || p.Equals("mobile", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Platform must be web or mobile.");
        }
    }
}
