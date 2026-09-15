using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Investments;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// Buying an asset writes a transaction against the account, and where that transaction
    /// lands decides how every other screen reads it. It used to land on the internal
    /// BalanceUpdate subcategory, because the lookup went by a seed key no seed writes.
    /// </summary>
    public class InvestmentContributionTests
    {
        private static (InvestmentService service, string dbName, int userId, int accountId) Setup()
        {
            var dbName = Guid.NewGuid().ToString();

            using (var seed = DbContextHelper.CreateInMemory(dbName))
            {
                var user = new User { Email = "inv@test.com", Name = "Test", PasswordHash = "x" };
                seed.Users.Add(user);
                seed.SaveChanges();

                // Mirrors registration: the internal category comes first, so "any
                // subcategory of this user" resolves to it.
                var systemCategory = new Category { UserId = user.Id, Name = "BalanceUpdate", IsSystem = true };
                seed.Categories.Add(systemCategory);
                seed.SaveChanges();
                seed.SubCategories.Add(new SubCategory
                {
                    UserId = user.Id,
                    CategoryId = systemCategory.Id,
                    Name = "BalanceUpdate",
                    IsSystem = true,
                });

                var account = new Account { UserId = user.Id, Name = "Corretora", Type = EnumAccountType.Checking };
                seed.Accounts.Add(account);
                seed.Budgets.Add(new Budget
                {
                    UserId = user.Id,
                    Name = "2026",
                    IsActive = true,
                    StartDate = 1,
                    Recurrence = EnumBudgetRecurrence.Monthly,
                });
                seed.SaveChanges();

                var factory = new Mock<IDbContextFactory<ApplicationDbContext>>();
                factory.Setup(f => f.CreateDbContext()).Returns(() => DbContextHelper.CreateInMemory(dbName));
                factory.Setup(f => f.CreateDbContextAsync(default))
                    .ReturnsAsync(() => DbContextHelper.CreateInMemory(dbName));

                var accrual = new FixedIncomeAccrual(
                    Mock.Of<IHttpClientFactory>(),
                    new MemoryCache(new MemoryCacheOptions()));

                return (new InvestmentService(factory.Object, accrual), dbName, user.Id, account.Id);
            }
        }

        private static CreateInvestmentTransactionRequestDto BuyRequest(int accountId) => new()
        {
            Ticker = "PETR4",
            Name = "Petrobras",
            AssetType = EnumAssetType.Acao,
            Operation = EnumInvestmentOperation.Buy,
            Date = new DateOnly(2026, 3, 10),
            Quantity = 10,
            UnitPrice = 3000,
            OtherCosts = 0,
            AccountId = accountId,
            CreateLinkedTransaction = true,
        };

        [Fact]
        public async Task Buy_FilesTheCashMovementUnderASavingsContributionSubCategory()
        {
            var (service, dbName, userId, accountId) = Setup();

            await service.RegisterTransactionAsync(userId, BuyRequest(accountId));

            using var context = DbContextHelper.CreateInMemory(dbName);
            var transaction = await context.Transactions
                .Include(t => t.SubCategory)
                .SingleAsync();

            Assert.Equal("Aporte", transaction.SubCategory.Name);
            Assert.False(transaction.SubCategory.IsSystem);
            // Money into an asset is money kept — the savings screens read this flag.
            Assert.True(transaction.SubCategory.IsSavings);
        }

        [Fact]
        public async Task Buy_MarksTheCashMovementAsOneTimeDebitInsideTheActiveBudget()
        {
            var (service, dbName, userId, accountId) = Setup();

            await service.RegisterTransactionAsync(userId, BuyRequest(accountId));

            using var context = DbContextHelper.CreateInMemory(dbName);
            var transaction = await context.Transactions.SingleAsync();

            Assert.Equal(EnumPaymentType.OneTime, transaction.PaymentType);
            Assert.Equal(EnumPaymentMethod.Debit, transaction.PaymentMethod);
            Assert.NotNull(transaction.BudgetId);
        }

        [Fact]
        public async Task Buy_LeavesTheMovementOutOfTheBudgetWhenAsked()
        {
            var (service, dbName, userId, accountId) = Setup();

            var request = BuyRequest(accountId);
            request.IncludeInBudget = false;

            await service.RegisterTransactionAsync(userId, request);

            using var context = DbContextHelper.CreateInMemory(dbName);
            Assert.Null((await context.Transactions.SingleAsync()).BudgetId);
        }

        [Fact]
        public async Task Buy_TagsTheCashMovement()
        {
            var (service, dbName, userId, accountId) = Setup();

            var request = BuyRequest(accountId);
            request.Tags = ["Longo prazo"];

            await service.RegisterTransactionAsync(userId, request);

            using var context = DbContextHelper.CreateInMemory(dbName);
            var transaction = await context.Transactions.Include(t => t.Tags).SingleAsync();

            Assert.Equal("Longo prazo", Assert.Single(transaction.Tags).Name);
        }

        [Fact]
        public async Task Buy_ReusesTheContributionSubCategoryOnTheNextPurchase()
        {
            var (service, dbName, userId, accountId) = Setup();

            await service.RegisterTransactionAsync(userId, BuyRequest(accountId));
            await service.RegisterTransactionAsync(userId, BuyRequest(accountId));

            using var context = DbContextHelper.CreateInMemory(dbName);
            var contributions = await context.SubCategories
                .Where(s => s.UserId == userId && s.Name == "Aporte")
                .ToListAsync();

            Assert.Single(contributions);
        }
    }
}
