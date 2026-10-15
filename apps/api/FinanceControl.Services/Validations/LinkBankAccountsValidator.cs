using FinanceControl.Shared.Dtos.Request.OpenFinance;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class LinkBankAccountsValidator : AbstractValidator<LinkBankAccountsRequestDto>
    {
        public LinkBankAccountsValidator()
        {
            RuleFor(x => x.Accounts)
                .NotEmpty().WithMessage("At least one account is required.")
                .Must(a => a.Select(i => i.BankAccountId).Distinct().Count() == a.Count)
                .WithMessage("Each bank account may appear only once.");

            RuleForEach(x => x.Accounts).ChildRules(item =>
            {
                item.RuleFor(i => i.BankAccountId).GreaterThan(0).WithMessage("BankAccountId must be positive.");
                item.RuleFor(i => i.Action).IsInEnum().WithMessage("Action must be Create, Link or Ignore.");
                item.RuleFor(i => i.AccountId)
                    .NotNull().GreaterThan(0)
                    .When(i => i.Action == EnumBankAccountLinkAction.Link)
                    .WithMessage("AccountId is required to link to an existing account.");
                item.RuleFor(i => i.Name)
                    .MaximumLength(100).WithMessage("Name must be at most 100 characters.");
                item.RuleFor(i => i.ImportFromDate)
                    .Must(d => d is null || d.Value <= DateOnly.FromDateTime(DateTime.UtcNow))
                    .WithMessage("ImportFromDate cannot be in the future.")
                    .Must(d => d is null || d.Value >= DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-1))
                    .WithMessage("ImportFromDate can be at most one year ago.");
            });
        }
    }
}
