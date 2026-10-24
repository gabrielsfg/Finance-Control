using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class RegisterBankConnectionValidator : AbstractValidator<RegisterBankConnectionRequestDto>
    {
        public RegisterBankConnectionValidator()
        {
            RuleFor(x => x.ItemId)
                .NotEmpty().WithMessage("ItemId is required.")
                .MaximumLength(100).WithMessage("ItemId is too long.");
        }
    }
}
