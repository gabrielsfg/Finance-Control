using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Tests.Unit.Validators
{
    public class BudgetValidatorTests
    {
        private readonly CreateBudgetValidator _createValidator = new();

        private static CreateBudgetRequestDto ValidBudget() => new()
        {
            Name = "Monthly Budget",
            StartDate = 1,
            Recurrence = EnumBudgetRecurrence.Monthly,
            IsActive = true,
            Areas =
            [
                new CreateAreaInBudgetDto
                {
                    Name = "Food",
                    Allocations =
                    [
                        new CreateAllocationInBudgetDto
                        {
                            SubCategoryId = 1,
                            ExpectedValue = 500,
                            AllocationType = EnumAllocationType.Expense,
                        }
                    ]
                }
            ]
        };

        [Fact]
        public void Valid_Budget_Passes()
            => Assert.True(_createValidator.Validate(ValidBudget()).IsValid);

        [Fact]
        public void Invalid_EmptyName_Fails()
        {
            var dto = ValidBudget();
            dto.Name = "";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_StartDateZero_Fails()
        {
            var dto = ValidBudget();
            dto.StartDate = 0;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_StartDate32_Fails()
        {
            var dto = ValidBudget();
            dto.StartDate = 32;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Theory]
        [InlineData(1)]
        [InlineData(15)]
        [InlineData(31)]
        public void Valid_StartDateBoundaries_Pass(int day)
        {
            var dto = ValidBudget();
            dto.StartDate = day;
            Assert.True(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_AreaWithEmptyName_Fails()
        {
            var dto = ValidBudget();
            dto.Areas[0].Name = "";
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_AllocationWithSubCategoryIdZero_Fails()
        {
            var dto = ValidBudget();
            dto.Areas[0].Allocations[0].SubCategoryId = 0;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Invalid_AllocationWithNegativeExpectedValue_Fails()
        {
            var dto = ValidBudget();
            dto.Areas[0].Allocations[0].ExpectedValue = -1;
            Assert.False(_createValidator.Validate(dto).IsValid);
        }

        [Fact]
        public void Valid_AllocationWithZeroExpectedValue_Passes()
        {
            var dto = ValidBudget();
            dto.Areas[0].Allocations[0].ExpectedValue = 0;
            Assert.True(_createValidator.Validate(dto).IsValid);
        }
    }
}
