using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class UpdateRecurringTransactionValidator : AbstractValidator<UpdateRecurringTransactionRequestDto>
    {
        public UpdateRecurringTransactionValidator()
        {
            RuleFor(x => x.SubCategoryId)
                .GreaterThan(0).WithMessage("SubCategoryId must be greater than 0.");

            RuleFor(x => x.AccountId)
                .GreaterThan(0).WithMessage("AccountId must be greater than 0.");

            RuleFor(x => x.Value)
                .GreaterThan(0).WithMessage("Value must be greater than 0.");

            RuleFor(x => x.EndDate)
                .GreaterThan(DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("EndDate must be a future date.")
                .When(x => x.EndDate.HasValue);
        }
    }
}
