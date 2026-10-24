using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class ReviewTransactionsValidator : AbstractValidator<ReviewTransactionsRequestDto>
    {
        public ReviewTransactionsValidator()
        {
            RuleFor(x => x.Ids)
                .NotEmpty().WithMessage("At least one transaction is required.")
                .Must(ids => ids.Count <= 500).WithMessage("At most 500 transactions at once.");
            RuleForEach(x => x.Ids).GreaterThan(0).WithMessage("Ids must be positive.");
        }
    }
}
