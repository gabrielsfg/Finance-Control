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

        [Fact]
        public void CreateGoal_Valid_Passes()
        {
            var v = new CreateGoalValidator();
            var dto = new CreateGoalRequestDto { Name = "PS5", Type = EnumGoalType.Item, TargetAmount = 500000 };
            Assert.True(v.Validate(dto).IsValid);
        }

        [Fact]
        public void CreateGoal_EmptyName_Fails()
        {
            var v = new CreateGoalValidator();
            Assert.False(v.Validate(new CreateGoalRequestDto { Name = "", Type = EnumGoalType.Item, TargetAmount = 100 }).IsValid);
        }

        [Fact]
        public void CreateGoal_NameTooLong_Fails()
        {
            var v = new CreateGoalValidator();
            var dto = new CreateGoalRequestDto { Name = new string('x', 201), Type = EnumGoalType.Item, TargetAmount = 100 };
            Assert.False(v.Validate(dto).IsValid);
        }

        [Fact]
        public void CreateGoal_ZeroTargetAmount_Fails()
        {
            var v = new CreateGoalValidator();
            var dto = new CreateGoalRequestDto { Name = "Goal", Type = EnumGoalType.Investment, TargetAmount = 0 };
            Assert.False(v.Validate(dto).IsValid);
        }

        [Fact]
        public void RecordGoalCheckpoint_Valid_Passes()
        {
            var v = new RecordGoalCheckpointValidator();
            Assert.True(v.Validate(new RecordGoalCheckpointRequestDto { Amount = 100 }).IsValid);
        }

        [Fact]
        public void RecordGoalCheckpoint_Zero_Fails()
        {
            var v = new RecordGoalCheckpointValidator();
            Assert.False(v.Validate(new RecordGoalCheckpointRequestDto { Amount = 0 }).IsValid);
        }

    }
}
