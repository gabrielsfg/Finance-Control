using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Tests.Unit.Validators
{
    public class AccountValidatorTests
    {
        private readonly CreateAccountValidator _createValidator = new();
        private readonly UpdateAccountValidator _updateValidator = new();

        private static CreateAccountRequestDto ValidDebit() => new()
        {
            Name = "My Account",
            Type = EnumAccountType.Debit,
        };

        private static CreateAccountRequestDto ValidCredit() => new()
        {
            Name = "My Card",
            Type = EnumAccountType.Credit,
            CreditLimit = 5000,
            BillingDueDay = 10,
        };

        [Fact]
        public void Create_ValidDebit_Passes()
            => Assert.True(_createValidator.Validate(ValidDebit()).IsValid);

        [Fact]
        public void Create_ValidCredit_Passes()
            => Assert.True(_createValidator.Validate(ValidCredit()).IsValid);

        [Fact]
        public void Create_EmptyName_Fails()
        {
            var dto = ValidDebit();
            dto.Name = "";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_CreditWithoutCreditLimit_Fails()
        {
            var dto = ValidCredit();
            dto.CreditLimit = null;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_CreditWithoutBillingDueDay_Fails()
        {
            var dto = ValidCredit();
            dto.BillingDueDay = null;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_CreditWithZeroCreditLimit_Fails()
        {
            var dto = ValidCredit();
            dto.CreditLimit = 0;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_CreditWithBillingDueDayOutOfRange_Fails()
        {
            var dto = ValidCredit();
            dto.BillingDueDay = 32;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_NonCreditWithCreditLimit_Fails()
        {
            var dto = ValidDebit();
            dto.CreditLimit = 5000;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_NonCreditWithBillingDueDay_Fails()
        {
            var dto = ValidDebit();
            dto.BillingDueDay = 10;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Theory]
        [InlineData(EnumAccountType.Savings)]
        [InlineData(EnumAccountType.Cash)]
        [InlineData(EnumAccountType.Checking)]
        public void Create_NonCreditTypes_WithoutCreditFields_Pass(EnumAccountType type)
        {
            var dto = new CreateAccountRequestDto { Name = "Account", Type = type };
            Assert.True(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Update_ValidCredit_Passes()
        {
            var dto = new UpdateAccountRequestDto
            {
                Id = 1,
                Name = "Card",
                Type = EnumAccountType.Credit,
                CreditLimit = 3000,
                BillingDueDay = 5,
            };
            Assert.True(_updateValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Update_NonCreditWithCreditFields_Fails()
        {
            var dto = new UpdateAccountRequestDto
            {
                Id = 1,
                Name = "Account",
                Type = EnumAccountType.Debit,
                CreditLimit = 3000,
            };
            Assert.False(_updateValidator.Validate(dto).IsValid);
        }
    }
}
