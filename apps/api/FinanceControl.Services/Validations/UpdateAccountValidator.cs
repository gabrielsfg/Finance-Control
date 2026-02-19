using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class UpdateAccountValidator : AbstractValidator<UpdateAccountRequestDto>
    {
        public UpdateAccountValidator()
        {
            RuleFor(a => a.Name).NotEmpty().WithMessage("Name is required");
        }
    }
}
