using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateBudgetSubCategoryAllocationValidator : AbstractValidator<UpdateSubCategoryToBudgetRequestDto>
    {
        public UpdateBudgetSubCategoryAllocationValidator()
        {
            RuleFor(a => a.ExpectedValue).GreaterThan(0).WithMessage("Invalid ExpectedValue");
            RuleFor(a => a.AllocationType).IsInEnum().WithMessage("Invalid AllocationType");
        }
    }
}
