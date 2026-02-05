using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class UpdateBudgetSubCategoryAllocationValidator : AbstractValidator<UpdateSubCategoryToBudgetRequestDto>
    {
        public UpdateBudgetSubCategoryAllocationValidator()
        {
            RuleFor(a => a.ExpectedValue).GreaterThan(0).WithMessage("Invalid ExpectedValue");
        }
    }
}
