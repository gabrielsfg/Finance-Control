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
    /// <summary>
    /// The running balance behind the "Evolução do Saldo" chart.
    /// </summary>
    /// <remarks>
    /// The daily net used to be written as <c>income ?? 0 - (expense ?? 0)</c>. In C# the
    /// null-coalescing operator binds looser than subtraction, so that parses as
    /// <c>income ?? (0 - expense)</c>: on any day that had income, the expenses of that day
    /// were thrown away and the balance could only climb. One real account drew a line
    /// peaking above R$ 25.000 while the true balance was below zero.
    /// </remarks>
    public class BalanceEvolutionTests
    {
        private static readonly DateOnly Start = new(2026, 6, 1);
        private static readonly DateOnly Finish = new(2026, 6, 30);

        private static AnalyticsService Setup(Action<ApplicationDbContext, int, int> seedData, out int userId)
        {
            var dbName = Guid.NewGuid().ToString();
            int id;

            using (var seed = DbContextHelper.CreateInMemory(dbName))
            {
                var user = new User { Email = "bal@test.com", Name = "Test", PasswordHash = "x" };
                seed.Users.Add(user);
                seed.SaveChanges();
                id = user.Id;

                var account = new Account { UserId = id, Name = "Corrente", Type = EnumAccountType.Checking };
                seed.Accounts.Add(account);
                seed.SaveChanges();

                seedData(seed, id, account.Id);
                seed.SaveChanges();
            }

            var factory = new Mock<IDbContextFactory<ApplicationDbContext>>();
            factory.Setup(f => f.CreateDbContext()).Returns(() => DbContextHelper.CreateInMemory(dbName));
            factory.Setup(f => f.CreateDbContextAsync(default))
                .ReturnsAsync(() => DbContextHelper.CreateInMemory(dbName));

            userId = id;
            return new AnalyticsService(factory.Object, Mock.Of<IHttpClientFactory>());
        }

        private static Transaction Movement(int userId, int accountId, EnumTransactionType type, int value, int day) =>
            new()
            {
                UserId = userId,
                AccountId = accountId,
                Type = type,
                Value = value,
                TransactionDate = new DateOnly(2026, 6, day),
                PaymentType = EnumPaymentType.OneTime,
                Description = type.ToString(),
            };

        [Fact]
        public async Task ADayWithBothIncomeAndExpense_CountsBoth()
        {
            // Salary of 1000 and 300 of spending land on the same day. The balance for that
            // day is 700 — not 1000, which is what dropping the expense side produced.
            var service = Setup((db, userId, account) =>
            {
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Income, 1_000, 10));
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Expense, 300, 10));
            }, out var uid);

            var points = await service.GetBalanceEvolutionAsync(new AnalyticsRequestDto
            {
                UserId = uid,
                StartDate = Start,
                FinishDate = Finish,
            });

            var day = Assert.Single(points);
            Assert.Equal(700, day.Balance);
        }

        [Fact]
        public async Task SpendingMoreThanYouEarnedThatMonth_DrivesTheBalanceNegative()
        {
            // The failure mode seen in practice: income every month keeps the line rising
            // while the expenses that outweigh it are discarded.
            var service = Setup((db, userId, account) =>
            {
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Income, 2_000, 5));
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Expense, 5_000, 5));
            }, out var uid);

            var points = await service.GetBalanceEvolutionAsync(new AnalyticsRequestDto
            {
                UserId = uid,
                StartDate = Start,
                FinishDate = Finish,
            });

            var day = Assert.Single(points);
            Assert.Equal(-3_000, day.Balance);
        }

        [Fact]
        public async Task TheBalanceAccumulatesAcrossDays()
        {
            var service = Setup((db, userId, account) =>
            {
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Income, 1_000, 1));
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Expense, 400, 2));
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Income, 500, 3));
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Expense, 100, 3));
            }, out var uid);

            var points = await service.GetBalanceEvolutionAsync(new AnalyticsRequestDto
            {
                UserId = uid,
                StartDate = Start,
                FinishDate = Finish,
            });

            Assert.Equal(3, points.Count);
            Assert.Equal(1_000, points[0].Balance);
            Assert.Equal(600, points[1].Balance);
            // 600 + 500 - 100: the mixed day nets out rather than counting income alone.
            Assert.Equal(1_000, points[2].Balance);
        }

        [Fact]
        public async Task MovementBeforeThePeriod_SeedsTheOpeningBalance()
        {
            var service = Setup((db, userId, account) =>
            {
                db.Transactions.Add(new Transaction
                {
                    UserId = userId,
                    AccountId = account,
                    Type = EnumTransactionType.Income,
                    Value = 5_000,
                    TransactionDate = new DateOnly(2026, 5, 20),
                    PaymentType = EnumPaymentType.OneTime,
                    Description = "antes",
                });
                db.Transactions.Add(Movement(userId, account, EnumTransactionType.Expense, 1_000, 10));
            }, out var uid);

            var points = await service.GetBalanceEvolutionAsync(new AnalyticsRequestDto
            {
                UserId = uid,
                StartDate = Start,
                FinishDate = Finish,
            });

            var day = Assert.Single(points);
            Assert.Equal(4_000, day.Balance);
        }
    }
}
