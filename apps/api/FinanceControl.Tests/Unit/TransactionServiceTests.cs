using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace FinanceControl.Tests.Unit
{
    public class TransactionServiceTests
    {
        // CalculateInstallmentValues is private — tested via CreateTransactionAsync
        // We use reflection to test it directly as a pure function.

        private static (int first, int other) CalcInstallments(int total, int installments)
        {
            var method = typeof(TransactionService)
                .GetMethod("CalculateInstallmentValues",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!;
            return ((int, int))method.Invoke(null, [total, installments])!;
        }

        [Fact]
        public void CalculateInstallmentValues_EvenDivision_AllInstallmentsEqual()
        {
            var (first, other) = CalcInstallments(900, 3);
            Assert.Equal(300, first);
            Assert.Equal(300, other);
        }

        [Fact]
        public void CalculateInstallmentValues_WithRemainder_FirstInstallmentAbsorbsRemainder()
        {
            var (first, other) = CalcInstallments(1000, 3);
            Assert.Equal(334, first);  // 333 + remainder 1
            Assert.Equal(333, other);
        }

        [Fact]
        public void CalculateInstallmentValues_TotalIsExact_SumEqualsTotal()
        {
            var total = 1000;
            var installments = 3;
            var (first, other) = CalcInstallments(total, installments);
            var sum = first + other * (installments - 1);
            Assert.Equal(total, sum);
        }

        [Fact]
        public void CalculateInstallmentValues_SingleInstallment_FirstEqualsTotal()
        {
            var (first, other) = CalcInstallments(500, 1);
            Assert.Equal(500, first);
            Assert.Equal(500, other);
        }

        [Fact]
        public void CalculateInstallmentValues_LargeRemainder_SumStillExact()
        {
            var total = 101;
            var installments = 10;
            var (first, other) = CalcInstallments(total, installments);
            var sum = first + other * (installments - 1);
            Assert.Equal(total, sum);
        }

        [Theory]
        [InlineData(100, 3)]
        [InlineData(999, 7)]
        [InlineData(1, 1)]
        [InlineData(10000, 12)]
        public void CalculateInstallmentValues_ArbitraryValues_SumAlwaysEqualsTotal(int total, int installments)
        {
            var (first, other) = CalcInstallments(total, installments);
            var sum = first + other * (installments - 1);
            Assert.Equal(total, sum);
        }

        [Fact]
        public async Task CreateInstallmentsAsync_InstallmentDates_OffsetByOneMonthEach()
        {
            using var context = DbContextHelper.CreateInMemory();
            var factoryMock = new Mock<IDbContextFactory<ApplicationDbContext>>();
            factoryMock.Setup(f => f.CreateDbContextAsync(default)).ReturnsAsync(context);

            var user = new User { Email = "test@test.com", Name = "Test", PasswordHash = "x" };
            context.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var subCategory = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            context.SubCategories.Add(subCategory);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Debit };
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            var service = new TransactionService(context, factoryMock.Object);
            var startDate = new DateOnly(2026, 1, 15);

            var dto = new CreateTransactionRequestDto
            {
                SubCategoryId = subCategory.Id,
                AccountId = account.Id,
                Value = 300,
                Type = EnumTransactionType.Expense,
                Description = "Test",
                TransactionDate = startDate,
                PaymentType = EnumPaymentType.Installment,
                TotalInstallments = 3,
                IncludeInBudget = false,
            };

            await service.CreateTransactionAsync(dto, user.Id);

            var transactions = await context.Transactions.OrderBy(t => t.TransactionDate).ToListAsync();
            Assert.Equal(3, transactions.Count);
            Assert.Equal(startDate, transactions[0].TransactionDate);
            Assert.Equal(startDate.AddMonths(1), transactions[1].TransactionDate);
            Assert.Equal(startDate.AddMonths(2), transactions[2].TransactionDate);
        }

        [Fact]
        public async Task CreateInstallmentsAsync_ParentChildLink_ChildrenHaveParentId()
        {
            using var context = DbContextHelper.CreateInMemory();
            var factoryMock = new Mock<IDbContextFactory<ApplicationDbContext>>();
            factoryMock.Setup(f => f.CreateDbContextAsync(default)).ReturnsAsync(context);

            var user = new User { Email = "test2@test.com", Name = "Test2", PasswordHash = "x" };
            context.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var subCategory = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            context.SubCategories.Add(subCategory);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Debit };
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            var service = new TransactionService(context, factoryMock.Object);

            var dto = new CreateTransactionRequestDto
            {
                SubCategoryId = subCategory.Id,
                AccountId = account.Id,
                Value = 1000,
                Type = EnumTransactionType.Expense,
                Description = "Parcelado",
                TransactionDate = new DateOnly(2026, 1, 1),
                PaymentType = EnumPaymentType.Installment,
                TotalInstallments = 3,
                IncludeInBudget = false,
            };

            await service.CreateTransactionAsync(dto, user.Id);

            var transactions = await context.Transactions.OrderBy(t => t.InstallmentNumber).ToListAsync();
            var parent = transactions.First(t => t.InstallmentNumber == 1);
            var children = transactions.Where(t => t.InstallmentNumber > 1).ToList();

            Assert.Null(parent.ParentTransactionId);
            Assert.All(children, c => Assert.Equal(parent.Id, c.ParentTransactionId));
        }
    }
}
