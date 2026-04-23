using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class AccountServiceTests
    {
        [Fact]
        public async Task CreateAccount_FirstAccount_AutoSetAsDefault()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var dto = new CreateAccountRequestDto
            {
                Name = "Wallet",
                Type = EnumAccountType.Debit,
                IsDefaultAccount = false,
            };

            await service.CreateAccountAsync(dto, user.Id);

            var account = context.Accounts.Single();
            Assert.True(account.IsDefaultAccount);
        }

        [Fact]
        public async Task CreateAccount_SecondAccountAsDefault_PreviousDefaultLosesDefault()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await service.CreateAccountAsync(new CreateAccountRequestDto
            {
                Name = "First",
                Type = EnumAccountType.Debit,
                IsDefaultAccount = true,
            }, user.Id);

            await service.CreateAccountAsync(new CreateAccountRequestDto
            {
                Name = "Second",
                Type = EnumAccountType.Savings,
                IsDefaultAccount = true,
            }, user.Id);

            var accounts = context.Accounts.ToList();
            var defaults = accounts.Where(a => a.IsDefaultAccount).ToList();

            Assert.Single(defaults);
            Assert.Equal("Second", defaults.First().Name);
        }

        [Fact]
        public async Task CreateAccount_SecondAccountNotDefault_PreviousDefaultRemainsDefault()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await service.CreateAccountAsync(new CreateAccountRequestDto
            {
                Name = "First",
                Type = EnumAccountType.Debit,
                IsDefaultAccount = true,
            }, user.Id);

            await service.CreateAccountAsync(new CreateAccountRequestDto
            {
                Name = "Second",
                Type = EnumAccountType.Savings,
                IsDefaultAccount = false,
            }, user.Id);

            var accounts = context.Accounts.ToList();
            var defaultAccount = accounts.Single(a => a.IsDefaultAccount);
            Assert.Equal("First", defaultAccount.Name);
        }

        [Fact]
        public async Task GetAllAccounts_Balance_IncomePositiveExpenseNegative()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            var category = new Domain.Entities.Category { Name = "Cat", UserId = 1 };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var subCat = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            context.SubCategories.Add(subCat);
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Debit };
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            context.Transactions.AddRange(
                new Transaction
                {
                    UserId = user.Id, AccountId = account.Id, SubCategoryId = subCat.Id,
                    Value = 1000, Type = EnumTransactionType.Income,
                    Description = "Salary", TransactionDate = new DateOnly(2026, 1, 1),
                    PaymentType = EnumPaymentType.OneTime,
                },
                new Transaction
                {
                    UserId = user.Id, AccountId = account.Id, SubCategoryId = subCat.Id,
                    Value = 300, Type = EnumTransactionType.Expense,
                    Description = "Rent", TransactionDate = new DateOnly(2026, 1, 5),
                    PaymentType = EnumPaymentType.OneTime,
                }
            );
            await context.SaveChangesAsync();

            var accounts = (await service.GetAllAccountAsync(user.Id)).ToList();

            Assert.Single(accounts);
            Assert.Equal(700, accounts[0].CurrentAmount); // 1000 - 300
        }

        [Fact]
        public async Task GetAllAccounts_Balance_NoTransactions_BalanceIsZero()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            context.Accounts.Add(new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Debit });
            await context.SaveChangesAsync();

            var accounts = (await service.GetAllAccountAsync(user.Id)).ToList();
            Assert.Equal(0, accounts[0].CurrentAmount);
        }

        [Fact]
        public async Task CreateAccount_CreditType_StoresCreditLimitAndBillingDueDay()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await service.CreateAccountAsync(new CreateAccountRequestDto
            {
                Name = "Card",
                Type = EnumAccountType.Credit,
                IsDefaultAccount = false,
                CreditLimit = 5000,
                BillingDueDay = 10,
            }, user.Id);

            var account = context.Accounts.Single();
            Assert.Equal(5000, account.CreditLimit);
            Assert.Equal(10, account.BillingDueDay);
        }

        [Fact]
        public async Task CreateAccount_NonCreditType_CreditFieldsAreNull()
        {
            using var context = DbContextHelper.CreateInMemory();
            var service = new AccountService(context);

            var user = new User { Email = "u@test.com", Name = "U", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await service.CreateAccountAsync(new CreateAccountRequestDto
            {
                Name = "Savings",
                Type = EnumAccountType.Savings,
                IsDefaultAccount = false,
                CreditLimit = 999,   // should be ignored
                BillingDueDay = 15,  // should be ignored
            }, user.Id);

            var account = context.Accounts.Single();
            Assert.Null(account.CreditLimit);
            Assert.Null(account.BillingDueDay);
        }
    }
}
