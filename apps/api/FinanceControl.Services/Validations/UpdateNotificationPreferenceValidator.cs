using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateNotificationPreferenceValidator : AbstractValidator<UpdateNotificationPreferenceRequestDto>
    {
        public UpdateNotificationPreferenceValidator()
        {
            RuleFor(p => p.CardDueDaysAhead)
                .InclusiveBetween(0, 30)
                .WithMessage("CardDueDaysAhead must be between 0 and 30.");

            RuleFor(p => p.CardClosingDaysAhead)
                .InclusiveBetween(0, 30)
                .WithMessage("CardClosingDaysAhead must be between 0 and 30.");

            RuleFor(p => p.BudgetWarningPercent)
                .InclusiveBetween(1, 100)
                .WithMessage("BudgetWarningPercent must be between 1 and 100.");
        }
    }
}
