using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class CreateSubCategoryValidator : AbstractValidator<CreateSubCategoryRequestDto>
    {
        public CreateSubCategoryValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
            RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("CategoryId is required");
        }
    }
}
