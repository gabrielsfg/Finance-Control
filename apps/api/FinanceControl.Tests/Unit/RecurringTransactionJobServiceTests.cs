using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceControl.Tests.Unit
{
    public class RecurringTransactionJobServiceTests
    {
        private static DateOnly NextOccurrenceAfter(EnumRecurrenceType recurrence, DateOnly from)
        {
            var method = typeof(RecurringTransactionJobService)
                .GetMethod("NextOccurrenceAfter",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!;
            return (DateOnly)method.Invoke(null, [recurrence, from])!;
        }

        private static DateOnly NextWorkDay(DateOnly from)
        {
            var method = typeof(RecurringTransactionJobService)
                .GetMethod("NextWorkDay",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!;
            return (DateOnly)method.Invoke(null, [from])!;
        }

        private static IServiceScopeFactory BuildScopeFactory(string dbName)
        {
            var services = new ServiceCollection();
            services.AddEntityFrameworkInMemoryDatabase();
            services.AddDbContext<FinanceControl.Data.Data.ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase(dbName));
            return services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
        }

        [Theory]
        [InlineData(EnumRecurrenceType.Daily, 2026, 1, 1, 2026, 1, 2)]
        [InlineData(EnumRecurrenceType.Weekly, 2026, 1, 1, 2026, 1, 8)]
        [InlineData(EnumRecurrenceType.Biweekly, 2026, 1, 1, 2026, 1, 15)]
        [InlineData(EnumRecurrenceType.Monthly, 2026, 1, 1, 2026, 2, 1)]
        [InlineData(EnumRecurrenceType.Quarterly, 2026, 1, 1, 2026, 4, 1)]
        [InlineData(EnumRecurrenceType.Semiannually, 2026, 1, 1, 2026, 7, 1)]
        [InlineData(EnumRecurrenceType.Annually, 2026, 1, 1, 2027, 1, 1)]
        public void NextOccurrenceAfter_AllTypes_CorrectNextDate(
            EnumRecurrenceType recurrence,
            int fromYear, int fromMonth, int fromDay,
            int expectedYear, int expectedMonth, int expectedDay)
        {
            var from = new DateOnly(fromYear, fromMonth, fromDay);
            var expected = new DateOnly(expectedYear, expectedMonth, expectedDay);
            Assert.Equal(expected, NextOccurrenceAfter(recurrence, from));
        }

        [Fact]
        public void NextOccurrenceAfter_WorkDay_FromFriday_SkipsToMonday()
        {
            var friday = new DateOnly(2026, 1, 2);
            Assert.Equal(DayOfWeek.Friday, friday.DayOfWeek);

            var next = NextOccurrenceAfter(EnumRecurrenceType.WorkDay, friday);

            Assert.Equal(DayOfWeek.Monday, next.DayOfWeek);
        }

        [Fact]
        public void NextOccurrenceAfter_WorkDay_FromThursday_IsNextDay()
        {
            var thursday = new DateOnly(2026, 1, 1);
            Assert.Equal(DayOfWeek.Thursday, thursday.DayOfWeek);

            var next = NextOccurrenceAfter(EnumRecurrenceType.WorkDay, thursday);

            Assert.Equal(DayOfWeek.Friday, next.DayOfWeek);
            Assert.Equal(thursday.AddDays(1), next);
        }

        [Fact]
        public void NextWorkDay_FromSaturday_SkipsToMonday()
        {
            var saturday = new DateOnly(2026, 1, 3);
            Assert.Equal(DayOfWeek.Saturday, saturday.DayOfWeek);

            var result = NextWorkDay(saturday);
            Assert.Equal(DayOfWeek.Monday, result.DayOfWeek);
        }

        [Fact]
        public void NextWorkDay_FromSunday_SkipsToMonday()
        {
            var sunday = new DateOnly(2026, 1, 4);
            Assert.Equal(DayOfWeek.Sunday, sunday.DayOfWeek);

            var result = NextWorkDay(sunday);
            Assert.Equal(DayOfWeek.Monday, result.DayOfWeek);
        }

        [Fact]
        public async Task RunAsync_Idempotency_DoesNotGenerateDuplicates()
        {
            var scopeFactory = BuildScopeFactory("idempotency_test");
            var jobService = new RecurringTransactionJobService(scopeFactory, NullLogger<RecurringTransactionJobService>.Instance);

            using var scope = scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<FinanceControl.Data.Data.ApplicationDbContext>();

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            ctx.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            ctx.Categories.Add(category);
            await ctx.SaveChangesAsync();

            var subCat = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            ctx.SubCategories.Add(subCat);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Debit };
            ctx.Accounts.Add(account);
            await ctx.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var rt = new RecurringTransaction
            {
                UserId = user.Id,
                SubCategoryId = subCat.Id,
                AccountId = account.Id,
                Value = 100,
                Type = EnumTransactionType.Expense,
                Description = "Monthly",
                Recurrence = EnumRecurrenceType.Monthly,
                StartDate = today,
                IsActive = true,
            };
            ctx.RecurringTransactions.Add(rt);
            await ctx.SaveChangesAsync();

            await jobService.RunAsync(CancellationToken.None);
            await jobService.RunAsync(CancellationToken.None);

            using var verifyScope = scopeFactory.CreateScope();
            var verifyCtx = verifyScope.ServiceProvider.GetRequiredService<FinanceControl.Data.Data.ApplicationDbContext>();
            var count = verifyCtx.Transactions.Count(t => t.RecurringTransactionId == rt.Id);

            Assert.Equal(1, count);
        }

        [Fact]
        public async Task RunAsync_CatchUp_GeneratesMissedDates()
        {
            var scopeFactory = BuildScopeFactory("catchup_test");
            var jobService = new RecurringTransactionJobService(scopeFactory, NullLogger<RecurringTransactionJobService>.Instance);

            using var scope = scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<FinanceControl.Data.Data.ApplicationDbContext>();

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            ctx.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            ctx.Categories.Add(category);
            await ctx.SaveChangesAsync();

            var subCat = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            ctx.SubCategories.Add(subCat);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Debit };
            ctx.Accounts.Add(account);
            await ctx.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var startDate = today.AddDays(-5);
            var rt = new RecurringTransaction
            {
                UserId = user.Id,
                SubCategoryId = subCat.Id,
                AccountId = account.Id,
                Value = 10,
                Type = EnumTransactionType.Expense,
                Description = "Daily",
                Recurrence = EnumRecurrenceType.Daily,
                StartDate = startDate,
                IsActive = true,
            };
            ctx.RecurringTransactions.Add(rt);
            await ctx.SaveChangesAsync();

            await jobService.RunAsync(CancellationToken.None);

            using var verifyScope = scopeFactory.CreateScope();
            var verifyCtx = verifyScope.ServiceProvider.GetRequiredService<FinanceControl.Data.Data.ApplicationDbContext>();
            var count = verifyCtx.Transactions.Count(t => t.RecurringTransactionId == rt.Id);

            Assert.Equal(6, count); // startDate + 5 more days up to today
        }
    }
}
