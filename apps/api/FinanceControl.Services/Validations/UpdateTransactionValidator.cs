using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class UpdateTransactionValidator : AbstractValidator<UpdateTransactionRequestDto>
    {
        public UpdateTransactionValidator()
        {
            RuleFor(x => x.AccountId)
                .GreaterThan(0).WithMessage("AccountId must be greater than 0.");

            RuleFor(x => x.Value)
                .GreaterThan(0).WithMessage("Value must be greater than 0.");

            RuleFor(x => x.TransactionDate)
                .NotEmpty().WithMessage("TransactionDate is required.");

            RuleFor(x => x.Type).IsInEnum()
                .WithMessage($"Type must be one of: {string.Join(", ", Enum.GetNames<EnumTransactionType>())}.");

            RuleFor(x => x.PaymentType).IsInEnum()
                .WithMessage($"PaymentType must be one of: {string.Join(", ", Enum.GetNames<EnumPaymentType>())}.");

            // ── Transfer: requires a distinct destination account, no subcategory/installment/recurrence ──
            When(x => x.Type == EnumTransactionType.Transfer, () =>
            {
                RuleFor(x => x.DestinationAccountId)
                    .NotNull().WithMessage("DestinationAccountId is required for transfers.")
                    .GreaterThan(0).WithMessage("DestinationAccountId must be greater than 0.");

                RuleFor(x => x.DestinationAccountId)
                    .NotEqual(x => x.AccountId).WithMessage("Source and destination accounts must be different.")
                    .When(x => x.DestinationAccountId.HasValue);

                RuleFor(x => x.PaymentType)
                    .Equal(EnumPaymentType.OneTime).WithMessage("Transfers must use the OneTime payment type.");
            });

            // ── Non-transfer: requires a subcategory and standard installment/recurrence rules ──
            When(x => x.Type != EnumTransactionType.Transfer, () =>
            {
                RuleFor(x => x.SubCategoryId)
                    .GreaterThan(0).WithMessage("SubCategoryId must be greater than 0.");

                RuleFor(x => x.TotalInstallments)
                    .GreaterThan(1).WithMessage("TotalInstallments must be greater than 1.")
                    .When(x => x.PaymentType == EnumPaymentType.Installment);

                RuleFor(x => x.TotalInstallments)
                    .Null().WithMessage("TotalInstallments should only be set when PaymentType is Installment.")
                    .When(x => x.PaymentType != EnumPaymentType.Installment);

                RuleFor(x => x.Recurrence).IsInEnum()
                    .WithMessage($"Recurrence must be one of: {string.Join(", ", Enum.GetNames<EnumRecurrenceType>())}.")
                    .When(x => x.Recurrence.HasValue);

                RuleFor(x => x.Recurrence)
                    .NotNull().WithMessage("Recurrence is required when PaymentType is Recurring.")
                    .When(x => x.PaymentType == EnumPaymentType.Recurring);
            });
        }
    }
}
