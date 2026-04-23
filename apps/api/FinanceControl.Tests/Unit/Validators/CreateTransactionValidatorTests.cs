using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Tests.Unit.Validators
{
    public class CreateTransactionValidatorTests
    {
        private readonly CreateTransactionValidator _validator = new();

        private static CreateTransactionRequestDto ValidOneTime() => new()
        {
            SubCategoryId = 1,
            AccountId = 1,
            Value = 100,
            Type = EnumTransactionType.Expense,
            PaymentType = EnumPaymentType.OneTime,
            TransactionDate = new DateOnly(2026, 1, 1),
        };

        [Fact]
        public void Valid_OneTime_PassesValidation()
        {
            var result = _validator.Validate(ValidOneTime());
            Assert.True(result.IsValid);
        }

        [Fact]
        public void Invalid_SubCategoryIdZero_Fails()
        {
            var dto = ValidOneTime();
            dto.SubCategoryId = 0;
            Assert.False(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_AccountIdZero_Fails()
        {
            var dto = ValidOneTime();
            dto.AccountId = 0;
            Assert.False(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_ValueZero_Fails()
        {
            var dto = ValidOneTime();
            dto.Value = 0;
            Assert.False(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Valid_Installment_WithTotalInstallments_Passes()
        {
            var dto = ValidOneTime();
            dto.PaymentType = EnumPaymentType.Installment;
            dto.TotalInstallments = 3;
            Assert.True(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_Installment_TotalInstallmentsOne_Fails()
        {
            var dto = ValidOneTime();
            dto.PaymentType = EnumPaymentType.Installment;
            dto.TotalInstallments = 1;
            Assert.False(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_OneTime_WithTotalInstallments_Fails()
        {
            var dto = ValidOneTime();
            dto.PaymentType = EnumPaymentType.OneTime;
            dto.TotalInstallments = 3;
            Assert.False(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Valid_Recurring_WithRecurrence_Passes()
        {
            var dto = ValidOneTime();
            dto.PaymentType = EnumPaymentType.Recurring;
            dto.Recurrence = EnumRecurrenceType.Monthly;
            Assert.True(_validator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_Recurring_WithoutRecurrence_Fails()
        {
            var dto = ValidOneTime();
            dto.PaymentType = EnumPaymentType.Recurring;
            dto.Recurrence = null;
            Assert.False(_validator.Validate(dto).IsValid);
        }
    }
}
