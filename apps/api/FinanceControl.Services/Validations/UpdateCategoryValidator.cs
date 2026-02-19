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
}
