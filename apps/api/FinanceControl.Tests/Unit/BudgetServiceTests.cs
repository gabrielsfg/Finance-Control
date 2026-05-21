using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class BudgetServiceTests
    {
        private static (DateOnly start, DateOnly finish) ComputeDates(int startDay, EnumBudgetRecurrence recurrence)
        {
            var now = DateTime.UtcNow;
            var start = new DateOnly(now.Year, now.Month, startDay);
            var finish = recurrence switch
            {
                EnumBudgetRecurrence.Weekly => start.AddDays(7),
                EnumBudgetRecurrence.Biweekly => start.AddDays(14),
                EnumBudgetRecurrence.Monthly => start.AddMonths(1),
                EnumBudgetRecurrence.Semiannually => start.AddMonths(6),
                EnumBudgetRecurrence.Annually => start.AddYears(1),
                _ => start
            };
            return (start, finish);
        }

        [Theory]
        [InlineData(EnumBudgetRecurrence.Weekly, 7)]
        [InlineData(EnumBudgetRecurrence.Biweekly, 14)]
        public void FinishDate_DayBasedRecurrences_CorrectDayOffset(EnumBudgetRecurrence recurrence, int expectedDays)
        {
            var (start, finish) = ComputeDates(1, recurrence);
            Assert.Equal(start.AddDays(expectedDays), finish);
        }

        [Fact]
        public void FinishDate_Monthly_ExactlyOneMonthLater()
        {
            var (start, finish) = ComputeDates(1, EnumBudgetRecurrence.Monthly);
            Assert.Equal(start.AddMonths(1), finish);
        }

        [Fact]
        public void FinishDate_Semiannually_SixMonthsLater()
        {
            var (start, finish) = ComputeDates(1, EnumBudgetRecurrence.Semiannually);
            Assert.Equal(start.AddMonths(6), finish);
        }

        [Fact]
        public void FinishDate_Annually_OneYearLater()
        {
            var (start, finish) = ComputeDates(1, EnumBudgetRecurrence.Annually);
            Assert.Equal(start.AddYears(1), finish);
        }

        [Fact]
        public void StartDate_UsesCurrentYearAndMonth()
        {
            var (start, _) = ComputeDates(15, EnumBudgetRecurrence.Monthly);
            var now = DateTime.UtcNow;
            Assert.Equal(now.Year, start.Year);
            Assert.Equal(now.Month, start.Month);
            Assert.Equal(15, start.Day);
        }

        [Fact]
        public async Task GetBudgetWithAllocations_SpentValue_OnlyCountsTransactionsWithinDateRange()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new BudgetService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var subCat = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            context.SubCategories.Add(subCat);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Checking };
            context.Accounts.Add(account);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var budget = new Budget
            {
                Name = "Budget",
                UserId = user.Id,
                IsActive = true,
                StartDate = today.Day,
                Recurrence = EnumBudgetRecurrence.Monthly,
            };
            context.Budgets.Add(budget);
            await context.SaveChangesAsync();

            var area = new Area { Name = "Area", BudgetId = budget.Id, UserId = user.Id };
            context.Areas.Add(area);
            await context.SaveChangesAsync();

            var allocation = new BudgetSubcategoryAllocation
            {
                BudgetId = budget.Id,
                AreaId = area.Id,
                SubCategoryId = subCat.Id,
                ExpectedValue = 500,
                AllocationType = EnumAllocationType.Expense,
            };
            context.BudgetSubcategoryAllocations.Add(allocation);

            // Inside range
            context.Transactions.Add(new Transaction
            {
                UserId = user.Id,
                BudgetId = budget.Id,
                SubCategoryId = subCat.Id,
                AccountId = account.Id,
                Value = 200,
                Type = EnumTransactionType.Expense,
                Description = "Inside",
                TransactionDate = today,
                PaymentType = EnumPaymentType.OneTime,
            });

            // Outside range (before start)
            context.Transactions.Add(new Transaction
            {
                UserId = user.Id,
                BudgetId = budget.Id,
                SubCategoryId = subCat.Id,
                AccountId = account.Id,
                Value = 999,
                Type = EnumTransactionType.Expense,
                Description = "Outside",
                TransactionDate = today.AddMonths(-1),
                PaymentType = EnumPaymentType.OneTime,
            });

            await context.SaveChangesAsync();

            var result = await service.GetBudgetWithAllocationsAsync(budget.Id, user.Id);

            var alloc = result.Areas.First().Allocations.First();
            Assert.Equal(500, alloc.ExpectedValue);
            Assert.Equal(200, alloc.SpentValue);
        }

        [Fact]
        public async Task GetBudgetWithAllocations_SpentValue_SeparatesIncomeFromExpense()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new BudgetService(context);

            var user = new User { Email = "u2@test.com", Name = "U2", PasswordHash = "x" };
            context.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var subCat = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            context.SubCategories.Add(subCat);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Checking };
            context.Accounts.Add(account);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var budget = new Budget
            {
                Name = "Budget2",
                UserId = user.Id,
                IsActive = true,
                StartDate = today.Day,
                Recurrence = EnumBudgetRecurrence.Monthly,
            };
            context.Budgets.Add(budget);
            await context.SaveChangesAsync();

            var area = new Area { Name = "Area", BudgetId = budget.Id, UserId = user.Id };
            context.Areas.Add(area);
            await context.SaveChangesAsync();

            var expenseAllocation = new BudgetSubcategoryAllocation
            {
                BudgetId = budget.Id,
                AreaId = area.Id,
                SubCategoryId = subCat.Id,
                ExpectedValue = 300,
                AllocationType = EnumAllocationType.Expense,
            };
            context.BudgetSubcategoryAllocations.Add(expenseAllocation);

            // Expense transaction
            context.Transactions.Add(new Transaction
            {
                UserId = user.Id,
                BudgetId = budget.Id,
                SubCategoryId = subCat.Id,
                AccountId = account.Id,
                Value = 150,
                Type = EnumTransactionType.Expense,
                Description = "Expense",
                TransactionDate = today,
                PaymentType = EnumPaymentType.OneTime,
            });

            // Income transaction — should NOT count towards expense allocation
            context.Transactions.Add(new Transaction
            {
                UserId = user.Id,
                BudgetId = budget.Id,
                SubCategoryId = subCat.Id,
                AccountId = account.Id,
                Value = 500,
                Type = EnumTransactionType.Income,
                Description = "Income",
                TransactionDate = today,
                PaymentType = EnumPaymentType.OneTime,
            });

            await context.SaveChangesAsync();

            var result = await service.GetBudgetWithAllocationsAsync(budget.Id, user.Id);

            var alloc = result.Areas.First().Allocations.First();
            Assert.Equal(150, alloc.SpentValue);
        }
    }
}
