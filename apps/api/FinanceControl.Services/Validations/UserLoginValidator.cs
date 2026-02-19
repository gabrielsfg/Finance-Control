using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Validations
{
    public class UserLoginValidator : AbstractValidator<UserLoginRequestDto>
    {
        public UserLoginValidator()
        {
            RuleFor(u => u.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address.");

            RuleFor(u => u.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.");
        }
    }
}
