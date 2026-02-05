using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class AddBudgetSubCategoryAllocationValidator : AbstractValidator<AddSubCategoryToBudgetRequestDto>
    {
        public AddBudgetSubCategoryAllocationValidator()
        {
            RuleFor(a => a.ExpectedValue).GreaterThan(0).WithMessage("Invalid ExpectedValue");
        }
    }
}
