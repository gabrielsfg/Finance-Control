using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class AddBudgetSubCategoryAllocationValidator : AbstractValidator<AddSubCategoryToBudgetRequestDto>
    {
        public AddBudgetSubCategoryAllocationValidator()
        {
            RuleFor(a => a.ExpectedValue).GreaterThan(0).WithMessage("Invalid ExpectedValue");
            RuleFor(a => a.AllocationType).IsInEnum().WithMessage("Invalid AllocationType");
        }
    }
}
