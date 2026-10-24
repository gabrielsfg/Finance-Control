using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class AdjustBankBalanceValidator : AbstractValidator<AdjustBankBalanceRequestDto>
    {
        public AdjustBankBalanceValidator()
        {
            RuleFor(x => x.BankAccountId).GreaterThan(0).WithMessage("BankAccountId must be positive.");
        }
    }
}
