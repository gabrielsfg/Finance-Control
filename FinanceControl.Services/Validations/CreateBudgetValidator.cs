using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateBudgetValidator : AbstractValidator<CreateBudgetRequestDto>
    {
        public CreateBudgetValidator()
        {
            RuleFor(b => b.Name).NotEmpty().WithMessage("Name is required");
            RuleFor(b => b.StartDate).LessThanOrEqualTo(31).GreaterThan(0).WithMessage("Start date must be a valid Day");
            RuleFor(b => b.Recurrence).IsInEnum()
                .WithMessage($"Recurrence must be one of: {string.Join(", ", Enum.GetNames<EnumBudgetRecurrence>())}");
            RuleForEach(b => b.Areas).ChildRules(area =>
            {
                area.RuleFor(a => a.Name).NotEmpty().WithMessage("Area name is required");
                area.RuleForEach(a => a.Allocations).ChildRules(allocation =>
                {
                    allocation.RuleFor(al => al.SubCategoryId).GreaterThan(0).WithMessage("SubCategoryId must be valid");
                    allocation.RuleFor(al => al.ExpectedValue).GreaterThanOrEqualTo(0).WithMessage("ExpectedValue must be non-negative");
                    allocation.RuleFor(al => al.AllocationType).IsInEnum()
                        .WithMessage($"AllocationType must be one of: {string.Join(", ", Enum.GetNames<EnumAllocationType>())}");
                });
            });
        }
    }
}
