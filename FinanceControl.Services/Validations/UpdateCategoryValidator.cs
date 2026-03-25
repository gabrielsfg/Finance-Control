using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryRequestDto>
    {
        public UpdateCategoryValidator()
        {
            RuleFor(c => c.Id).GreaterThan(0).WithMessage("Invalid Category");
            RuleFor(c => c.Name).NotEmpty().WithMessage("Name is required.");
        }
    }

    public class UpdateCategoriesValidator : AbstractValidator<UpdateCategoriesRequestDto>
    {
        public UpdateCategoriesValidator()
        {
            RuleFor(x => x.Categories).NotEmpty().WithMessage("Categories list cannot be empty.");
            RuleForEach(x => x.Categories).SetValidator(new UpdateCategoryValidator());
        }
    }
}
