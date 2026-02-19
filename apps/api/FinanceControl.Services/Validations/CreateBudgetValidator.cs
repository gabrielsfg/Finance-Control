using FinanceControl.Domain.Enums;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class CreateBudgetValidator : AbstractValidator<CreateBudgetResquestDto>
    {
        public CreateBudgetValidator()
        {
            RuleFor(b => b.Name).NotEmpty().WithMessage("Name is required");
            RuleFor(b => b.StartDate).LessThanOrEqualTo(31).GreaterThan(0).WithMessage("Start date must be a valid Day");
            RuleFor(b => b.Reccurrence)
                .IsEnumName(typeof(EnumBudgetRecurrence), caseSensitive: false)
                .WithMessage($"Recurrence must be one of: {string.Join(", ", Enum.GetNames<EnumBudgetRecurrence>())}");
        }
    }
}
