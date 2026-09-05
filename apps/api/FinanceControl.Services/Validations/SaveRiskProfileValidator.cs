using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class SaveRiskProfileValidator : AbstractValidator<SaveRiskProfileRequestDto>
    {
        public SaveRiskProfileValidator()
        {
            RuleFor(x => x.InvestmentHorizon)
                .IsInEnum().WithMessage("InvestmentHorizon is not a valid option.");

            RuleFor(x => x.LossTolerance)
                .IsInEnum().WithMessage("LossTolerance is not a valid option.");

            RuleFor(x => x.ExperienceLevel)
                .IsInEnum().WithMessage("ExperienceLevel is not a valid option.");

            RuleFor(x => x.ReserveMonthsTarget)
                .InclusiveBetween(0, 24)
                .WithMessage("ReserveMonthsTarget must be between 0 and 24 months.");
        }
    }
}
