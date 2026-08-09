using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Tests.Unit.Validators
{
    public class OtherValidatorsTests
    {
        // --- CategoryValidator ---

        [Fact]
        public void CreateCategory_Valid_Passes()
        {
            var v = new CreateCategoryValidator();
            Assert.True(v.Validate(new CreateCategoryRequestDto { Name = "Food" }).IsValid);
        }

        [Fact]
        public void CreateCategory_EmptyName_Fails()
        {
            var v = new CreateCategoryValidator();
            Assert.False(v.Validate(new CreateCategoryRequestDto { Name = "" }).IsValid);
        }

        // --- SubCategoryValidator ---

        [Fact]
        public void CreateSubCategory_Valid_Passes()
        {
            var v = new CreateSubCategoryValidator();
            Assert.True(v.Validate(new CreateSubCategoryRequestDto { Name = "Groceries", CategoryId = 1 }).IsValid);
        }

        [Fact]
        public void CreateSubCategory_CategoryIdZero_Fails()
        {
            var v = new CreateSubCategoryValidator();
            Assert.False(v.Validate(new CreateSubCategoryRequestDto { Name = "Sub", CategoryId = 0 }).IsValid);
        }

        // --- UpdateRecurringTransactionValidator ---

        [Fact]
        public void UpdateRecurring_Valid_Passes()
        {
            var v = new UpdateRecurringTransactionValidator();
            var dto = new UpdateRecurringTransactionRequestDto
            {
                SubCategoryId = 1,
                AccountId = 1,
                Value = 100,
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            };
            Assert.True(v.Validate(dto).IsValid);
        }

        [Fact]
        public void UpdateRecurring_PastEndDate_Fails()
        {
            var v = new UpdateRecurringTransactionValidator();
            var dto = new UpdateRecurringTransactionRequestDto
            {
                SubCategoryId = 1,
                AccountId = 1,
                Value = 100,
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            };
            Assert.False(v.Validate(dto).IsValid);
        }

        [Fact]
        public void UpdateRecurring_NullEndDate_Passes()
        {
            var v = new UpdateRecurringTransactionValidator();
            var dto = new UpdateRecurringTransactionRequestDto
            {
                SubCategoryId = 1,
                AccountId = 1,
                Value = 100,
                EndDate = null,
            };
            Assert.True(v.Validate(dto).IsValid);
        }

        // --- GoalValidators ---

        // Every case starts from a valid goal and breaks one thing, so a failing
        // assertion can only be about the field the test names.
        private static CreateGoalRequestDto ValidCreateGoal() => new()
        {
            Name = "PS5",
            Type = EnumGoalType.Item,
            TargetAmount = 500000,
            TargetDate = new DateOnly(2027, 12, 31),
        };

        [Fact]
        public void CreateGoal_Valid_Passes()
            => Assert.True(new CreateGoalValidator().Validate(ValidCreateGoal()).IsValid);

        [Fact]
        public void CreateGoal_EmptyName_Fails()
        {
            var dto = ValidCreateGoal();
            dto.Name = "";
            Assert.False(new CreateGoalValidator().Validate(dto).IsValid);
        }

        [Fact]
        public void CreateGoal_NameTooLong_Fails()
        {
            var dto = ValidCreateGoal();
            dto.Name = new string('x', 201);
            Assert.False(new CreateGoalValidator().Validate(dto).IsValid);
        }

        [Fact]
        public void CreateGoal_ZeroTargetAmount_Fails()
        {
            var dto = ValidCreateGoal();
            dto.TargetAmount = 0;
            Assert.False(new CreateGoalValidator().Validate(dto).IsValid);
        }

        /// <summary>
        /// A goal without a deadline has no progress to measure: the whole card is built
        /// around "how long is left", and both clients already refuse to create one
        /// without a date. The rule is what keeps a goal from reaching the database as
        /// 01/01/0001.
        /// </summary>
        [Fact]
        public void CreateGoal_WithoutTargetDate_Fails()
        {
            var dto = ValidCreateGoal();
            dto.TargetDate = default;
            Assert.False(new CreateGoalValidator().Validate(dto).IsValid);
        }

    }
}
