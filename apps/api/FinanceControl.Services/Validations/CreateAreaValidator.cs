using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class CreateAreaValidator : AbstractValidator<CreateAreaRequestDto>
    {
        public CreateAreaValidator()
        {
            RuleFor(a => a.BudgetId).GreaterThan(0).WithMessage("Invalid BudgetId");
            RuleFor(a => a.Name).NotEmpty().WithMessage("Name is required");
        }
    }
}
