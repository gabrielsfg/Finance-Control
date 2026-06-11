using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateAccountValidator : AbstractValidator<CreateAccountRequestDto>
    {
        public CreateAccountValidator()
        {
            RuleFor(a => a.Name).NotEmpty().WithMessage("Name is required.");

            RuleFor(a => a.CreditLimit)
                .NotNull().WithMessage("CreditLimit is required for Credit/Checking accounts.")
                .GreaterThan(0).WithMessage("CreditLimit must be greater than zero.")
                .When(a => a.Type == EnumAccountType.Credit || a.Type == EnumAccountType.Checking);

            RuleFor(a => a.BillingDueDay)
                .NotNull().WithMessage("BillingDueDay is required for Credit/Checking accounts.")
                .InclusiveBetween(1, 31).WithMessage("BillingDueDay must be between 1 and 31.")
                .When(a => a.Type == EnumAccountType.Credit || a.Type == EnumAccountType.Checking);

            RuleFor(a => a.CreditLimit)
                .Null().WithMessage("CreditLimit is only applicable to Credit/Checking accounts.")
                .When(a => a.Type != EnumAccountType.Credit && a.Type != EnumAccountType.Checking);

            RuleFor(a => a.BillingDueDay)
                .Null().WithMessage("BillingDueDay is only applicable to Credit/Checking accounts.")
                .When(a => a.Type != EnumAccountType.Credit && a.Type != EnumAccountType.Checking);

            // Closing day is optional and credit-card only.
            RuleFor(a => a.BillingClosingDay)
                .InclusiveBetween(1, 31).WithMessage("BillingClosingDay must be between 1 and 31.")
                .When(a => a.BillingClosingDay.HasValue);

            RuleFor(a => a.BillingClosingDay)
                .Null().WithMessage("BillingClosingDay is only applicable to Credit accounts.")
                .When(a => a.Type != EnumAccountType.Credit);
        }
    }
}
