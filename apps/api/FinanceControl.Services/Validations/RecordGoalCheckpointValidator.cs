using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class RecordGoalCheckpointValidator : AbstractValidator<RecordGoalCheckpointRequestDto>
    {
        public RecordGoalCheckpointValidator()
        {
            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Amount must be greater than zero.");
        }
    }
}
