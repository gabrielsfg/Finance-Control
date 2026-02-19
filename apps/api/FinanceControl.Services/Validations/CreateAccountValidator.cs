using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class CreateAccountValidator : AbstractValidator<CreateAccountRequestDto>
    {
        public CreateAccountValidator()
        {
            RuleFor(a => a.Name).NotEmpty().WithMessage("Name is required");
        }
    }
}
