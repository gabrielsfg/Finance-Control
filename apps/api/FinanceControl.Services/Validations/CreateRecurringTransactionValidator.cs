using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateRecurringTransactionValidator : AbstractValidator<CreateRecurringTransactionRequestDto>
    {
        public CreateRecurringTransactionValidator()
        {
            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required.");

            RuleFor(x => x.Value)
                .GreaterThan(0).WithMessage("Value must be greater than zero.");

            RuleFor(x => x.SubCategoryId)
                .GreaterThan(0).WithMessage("SubCategoryId is required.");

            RuleFor(x => x.AccountId)
                .GreaterThan(0).WithMessage("AccountId is required.");

            RuleFor(x => x.Recurrence)
                .NotEqual(EnumRecurrenceType.None).WithMessage("A recurrence frequency is required.");

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate).WithMessage("EndDate must be after StartDate.")
                .When(x => x.EndDate.HasValue);
        }
    }
}
