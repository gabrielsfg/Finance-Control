using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos;
using FinanceControl.Shared.Dtos.Request;

namespace FinanceControl.Tests.Unit.Validators
{
    public class UserValidatorTests
    {
        private readonly CreateUserValidator _createValidator = new();
        private readonly UserLoginValidator _loginValidator = new();

        private static CreateUserRequestDto ValidCreate() => new()
        {
            Email = "user@example.com",
            Password = "Password@1",
            Name = "Test User",
            AcceptedTerms = true,
        };

        [Fact]
        public void Create_ValidUser_Passes()
            => Assert.True(_createValidator.Validate(ValidCreate()).IsValid);

        /// <summary>
        /// The UI checkbox is a convenience; this is the rule. An account that exists
        /// without a consent record is the failure this whole feature exists to prevent,
        /// so it has to be impossible from any client.
        /// </summary>
        [Fact]
        public void Create_WithoutAcceptingTerms_Fails()
        {
            var dto = ValidCreate();
            dto.AcceptedTerms = false;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_InvalidEmail_Fails()
        {
            var dto = ValidCreate();
            dto.Email = "not-an-email";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_EmptyEmail_Fails()
        {
            var dto = ValidCreate();
            dto.Email = "";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_EmptyName_Fails()
        {
            var dto = ValidCreate();
            dto.Name = "";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_PasswordTooShort_Fails()
        {
            var dto = ValidCreate();
            dto.Password = "Ab@1";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_PasswordNoUppercase_Fails()
        {
            var dto = ValidCreate();
            dto.Password = "password@1";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_PasswordNoLowercase_Fails()
        {
            var dto = ValidCreate();
            dto.Password = "PASSWORD@1";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_PasswordNoDigit_Fails()
        {
            var dto = ValidCreate();
            dto.Password = "Password@A";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Create_PasswordNoSpecialChar_Fails()
        {
            var dto = ValidCreate();
            dto.Password = "Password1A";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Login_Valid_Passes()
        {
            var dto = new UserLoginRequestDto { Email = "u@test.com", Password = "Password@1" };
            Assert.True(_loginValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Login_InvalidEmail_Fails()
        {
            var dto = new UserLoginRequestDto { Email = "notanemail", Password = "Password@1" };
            Assert.False(_loginValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Login_ShortPassword_Fails()
        {
            var dto = new UserLoginRequestDto { Email = "u@test.com", Password = "short" };
            Assert.False(_loginValidator.Validate(dto).IsValid);
        }
    }
}
