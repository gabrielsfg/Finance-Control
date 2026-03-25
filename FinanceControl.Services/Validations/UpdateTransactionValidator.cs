using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class UpdateTransactionValidator : AbstractValidator<UpdateTransactionRequestDto>
    {
        public UpdateTransactionValidator()
        {
            RuleFor(x => x.SubCategoryId)
                .GreaterThan(0).WithMessage("SubCategoryId must be greater than 0.");

            RuleFor(x => x.AccountId)
                .GreaterThan(0).WithMessage("AccountId must be greater than 0.");

            RuleFor(x => x.Value)
                .GreaterThan(0).WithMessage("Value must be greater than 0.");

            RuleFor(x => x.TransactionDate)
                .NotEmpty().WithMessage("TransactionDate is required.");
        }
    }
}
