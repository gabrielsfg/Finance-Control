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

        // --- AreaValidator ---

        [Fact]
        public void CreateArea_Valid_Passes()
        {
            var v = new CreateAreaValidator();
            Assert.True(v.Validate(new CreateAreaRequestDto { Name = "Living", BudgetId = 1 }).IsValid);
        }

        [Fact]
        public void CreateArea_BudgetIdZero_Fails()
        {
            var v = new CreateAreaValidator();
            Assert.False(v.Validate(new CreateAreaRequestDto { Name = "Living", BudgetId = 0 }).IsValid);
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

        // --- WishlistValidators ---

        [Fact]
        public void CreateWishlistItem_Valid_Passes()
        {
            var v = new CreateWishlistItemValidator();
            var dto = new CreateWishlistItemRequestDto { Name = "PS5" };
            Assert.True(v.Validate(dto).IsValid);
        }

        [Fact]
        public void CreateWishlistItem_EmptyName_Fails()
        {
            var v = new CreateWishlistItemValidator();
            Assert.False(v.Validate(new CreateWishlistItemRequestDto { Name = "" }).IsValid);
        }

        [Fact]
        public void CreateWishlistItem_NameTooLong_Fails()
        {
            var v = new CreateWishlistItemValidator();
            var dto = new CreateWishlistItemRequestDto { Name = new string('x', 201) };
            Assert.False(v.Validate(dto).IsValid);
        }

        [Fact]
        public void CreateWishlistItem_NegativeTargetPrice_Fails()
        {
            var v = new CreateWishlistItemValidator();
            var dto = new CreateWishlistItemRequestDto { Name = "Item", TargetPrice = -1 };
            Assert.False(v.Validate(dto).IsValid);
        }

        [Fact]
        public void RecordWishlistPrice_Valid_Passes()
        {
            var v = new RecordWishlistPriceValidator();
            Assert.True(v.Validate(new RecordWishlistPriceRequestDto { Price = 100 }).IsValid);
        }

        [Fact]
        public void RecordWishlistPrice_Zero_Fails()
        {
            var v = new RecordWishlistPriceValidator();
            Assert.False(v.Validate(new RecordWishlistPriceRequestDto { Price = 0 }).IsValid);
        }

        // --- BudgetSubCategoryAllocationValidator ---

        [Fact]
        public void AddSubCategoryAllocation_Valid_Passes()
        {
            var v = new AddBudgetSubCategoryAllocationValidator();
            var dto = new AddSubCategoryToBudgetRequestDto
            {
                ExpectedValue = 200,
                AllocationType = EnumAllocationType.Expense,
            };
            Assert.True(v.Validate(dto).IsValid);
        }

        [Fact]
        public void AddSubCategoryAllocation_ZeroExpectedValue_Fails()
        {
            var v = new AddBudgetSubCategoryAllocationValidator();
            var dto = new AddSubCategoryToBudgetRequestDto
            {
                ExpectedValue = 0,
                AllocationType = EnumAllocationType.Expense,
            };
            Assert.False(v.Validate(dto).IsValid);
        }
    }
}
