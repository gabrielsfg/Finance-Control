using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Shared.Helpers;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// A tag exists so that everything filed under it comes back together. Two rows that
    /// differ only by case or accent quietly break that, and the split is invisible until
    /// someone filters months later and gets half their transactions.
    /// </summary>
    public class TagDeduplicationTests
    {
        [Theory]
        [InlineData("Férias", "ferias")]
        [InlineData("ferias", "ferias")]
        [InlineData("FÉRIAS", "ferias")]
        [InlineData("  Férias  ", "ferias")]
        [InlineData("Férias 2026", "ferias2026")]
        [InlineData("ferias-2026", "ferias2026")]
        [InlineData("Ação", "acao")]
        [InlineData("", "")]
        [InlineData("   ", "")]
        public void ComparisonKey_CollapsesCaseAccentsAndPunctuation(string input, string expected)
            => Assert.Equal(expected, TextNormalization.ToComparisonKey(input));

        private static (TransactionService service, User user, SubCategory subCategory, Account account)
            SetupTransactionService(ApplicationDbContext context)
        {
            var factoryMock = new Mock<IDbContextFactory<ApplicationDbContext>>();
            factoryMock.Setup(f => f.CreateDbContextAsync(default)).ReturnsAsync(context);

            var user = new User { Email = "tags@test.com", Name = "Test", PasswordHash = "x" };
            context.Users.Add(user);
            context.SaveChanges();

            var category = new Category { Name = "Cat", UserId = user.Id };
            context.Categories.Add(category);
            context.SaveChanges();

            var subCategory = new SubCategory { Name = "Sub", CategoryId = category.Id, UserId = user.Id };
            var account = new Account { Name = "Wallet", UserId = user.Id, Type = EnumAccountType.Checking };
            context.SubCategories.Add(subCategory);
            context.Accounts.Add(account);
            context.SaveChanges();

            return (new TransactionService(context, factoryMock.Object), user, subCategory, account);
        }

        private static CreateTransactionRequestDto BuildTransaction(
            SubCategory subCategory,
            Account account,
            List<string> tags) => new()
            {
                SubCategoryId = subCategory.Id,
                AccountId = account.Id,
                Value = 1000,
                Type = EnumTransactionType.Expense,
                Description = "Test",
                TransactionDate = new DateOnly(2026, 1, 15),
                PaymentType = EnumPaymentType.OneTime,
                IncludeInBudget = false,
                Tags = tags,
            };

        [Fact]
        public async Task Create_ReusesAnExistingTagThatDiffersOnlyByCase()
        {
            using var context = DbContextHelper.CreateInMemory();
            var (service, user, subCategory, account) = SetupTransactionService(context);

            context.Tags.Add(new Tag { UserId = user.Id, Name = "Viagem" });
            await context.SaveChangesAsync();

            await service.CreateTransactionAsync(
                BuildTransaction(subCategory, account, ["viagem"]), user.Id);

            var tags = await context.Tags.Where(t => t.UserId == user.Id).ToListAsync();

            // One row, and it keeps the spelling it was created with.
            Assert.Single(tags);
            Assert.Equal("Viagem", tags[0].Name);

            var transaction = await context.Transactions.Include(t => t.Tags).SingleAsync();
            Assert.Equal("Viagem", Assert.Single(transaction.Tags).Name);
        }

        [Fact]
        public async Task Create_ReusesAnExistingTagThatDiffersOnlyByAccent()
        {
            using var context = DbContextHelper.CreateInMemory();
            var (service, user, subCategory, account) = SetupTransactionService(context);

            context.Tags.Add(new Tag { UserId = user.Id, Name = "Férias" });
            await context.SaveChangesAsync();

            await service.CreateTransactionAsync(
                BuildTransaction(subCategory, account, ["ferias"]), user.Id);

            var tag = Assert.Single(await context.Tags.Where(t => t.UserId == user.Id).ToListAsync());
            Assert.Equal("Férias", tag.Name);
        }

        [Fact]
        public async Task Create_CollapsesVariantsSentInTheSameRequest()
        {
            using var context = DbContextHelper.CreateInMemory();
            var (service, user, subCategory, account) = SetupTransactionService(context);

            await service.CreateTransactionAsync(
                BuildTransaction(subCategory, account, ["Férias", "ferias", "FERIAS"]), user.Id);

            Assert.Single(await context.Tags.Where(t => t.UserId == user.Id).ToListAsync());
        }

        [Fact]
        public async Task Create_StillCreatesAGenuinelyNewTag()
        {
            using var context = DbContextHelper.CreateInMemory();
            var (service, user, subCategory, account) = SetupTransactionService(context);

            context.Tags.Add(new Tag { UserId = user.Id, Name = "Viagem" });
            await context.SaveChangesAsync();

            await service.CreateTransactionAsync(
                BuildTransaction(subCategory, account, ["Mercado"]), user.Id);

            var names = await context.Tags.Where(t => t.UserId == user.Id).Select(t => t.Name).ToListAsync();
            Assert.Equal(2, names.Count);
            Assert.Contains("Mercado", names);
        }

        [Fact]
        public async Task Create_DoesNotReuseATagFromAnotherUser()
        {
            using var context = DbContextHelper.CreateInMemory();
            var (service, user, subCategory, account) = SetupTransactionService(context);

            var stranger = new User { Email = "other@test.com", Name = "Other", PasswordHash = "x" };
            context.Users.Add(stranger);
            await context.SaveChangesAsync();
            context.Tags.Add(new Tag { UserId = stranger.Id, Name = "Viagem" });
            await context.SaveChangesAsync();

            await service.CreateTransactionAsync(
                BuildTransaction(subCategory, account, ["viagem"]), user.Id);

            var mine = await context.Tags.Where(t => t.UserId == user.Id).ToListAsync();
            Assert.Equal("viagem", Assert.Single(mine).Name);
        }

        [Fact]
        public async Task CreateTag_RefusesAnAccentOrCaseVariant()
        {
            using var context = DbContextHelper.CreateInMemory();
            var user = new User { Email = "tags@test.com", Name = "Test", PasswordHash = "x" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var service = new TagService(context);
            var first = await service.CreateTagAsync(new CreateTagRequestDto { Name = "Férias" }, user.Id);
            Assert.True(first.IsSuccess);

            var duplicate = await service.CreateTagAsync(new CreateTagRequestDto { Name = "ferias" }, user.Id);

            Assert.True(duplicate.IsFailure);
            Assert.Single(await context.Tags.Where(t => t.UserId == user.Id).ToListAsync());
        }
    }
}
