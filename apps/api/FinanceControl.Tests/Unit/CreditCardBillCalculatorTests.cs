using FinanceControl.Services.Helpers;
using FinanceControl.Shared.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class CreditCardBillCalculatorTests
    {
        private static (DateOnly, int) M(int year, int month, int day, int amount) => (new DateOnly(year, month, day), amount);

        [Fact]
        public void PaidClosedBill_LeavesTheOpenOne_AndInstallmentsAsUpcomingBills()
        {
            // Nubank-like: closes on the 4th, due on the 11th; today 9 Nov.
            var bills = CreditCardBillCalculator.Calculate(4, 11, new DateOnly(2026, 11, 9),
            [
                M(2026, 10, 10, -442991),   // October cycle purchases
                M(2026, 11, 9, 442991),     // bill paid
                M(2026, 11, 5, -40675),     // open bill purchase
                M(2026, 12, 5, -40075),     // installment 2
                M(2027, 1, 5, -40075)       // installment 3
            ]);

            Assert.Null(bills.ClosedBill);
            Assert.Equal((new DateOnly(2026, 12, 4), new DateOnly(2026, 12, 11), 40675),
                (bills.CurrentBill.ClosingDate, bills.CurrentBill.DueDate, bills.CurrentBill.Amount));
            Assert.Equal([40075, 40075], bills.UpcomingBills.Select(b => b.Amount));
            Assert.Equal(new DateOnly(2027, 1, 11), bills.UpcomingBills[0].DueDate);
        }

        [Fact]
        public void ClosedBillNotYetPaid_IsReportedApart()
        {
            var bills = CreditCardBillCalculator.Calculate(4, 11, new DateOnly(2026, 11, 6),
            [
                M(2026, 10, 10, -100000),
                M(2026, 11, 5, -5000)
            ]);

            Assert.Equal(100000, bills.ClosedBill!.Amount);
            Assert.Equal(new DateOnly(2026, 11, 11), bills.ClosedBill.DueDate);
            Assert.Equal(5000, bills.CurrentBill.Amount);
        }

        [Fact]
        public void PurchaseOnTheClosingDay_GoesToTheNextBill_AndDueDayBeforeClosingFallsNextMonth()
        {
            var bills = CreditCardBillCalculator.Calculate(25, 5, new DateOnly(2026, 11, 20),
            [
                M(2026, 11, 24, -1000),
                M(2026, 11, 25, -2000)
            ]);

            Assert.Equal((1000, new DateOnly(2026, 12, 5)), (bills.CurrentBill.Amount, bills.CurrentBill.DueDate));
            Assert.Equal(2000, Assert.Single(bills.UpcomingBills).Amount);
        }

        [Fact]
        public void ClosingDayPastTheEndOfTheMonth_FallsOnTheLastDay()
        {
            var bills = CreditCardBillCalculator.Calculate(31, 10, new DateOnly(2027, 2, 10), []);
            Assert.Equal(new DateOnly(2027, 2, 28), bills.CurrentBill.ClosingDate);
            Assert.Equal(new DateOnly(2027, 3, 10), bills.CurrentBill.DueDate);
        }

        [Theory]
        [InlineData("Nu Pagamentos S.A. - Instituição de Pagamento", "nubank")]
        [InlineData("Itaú Unibanco", "itau")]
        [InlineData("Banco Inter", "inter")]
        [InlineData("XP Investimentos CCTVM S.A.", "xp")]
        [InlineData("Caju Benefícios", "caju")]
        [InlineData("Pluxee Brasil (Sodexo)", "pluxee")]
        [InlineData("Banco Daycoval S.A.", "daycoval")]
        [InlineData("Ágora Investimentos", "agora")]
        [InlineData("Flash", "flash")]
        [InlineData("Inter", "inter")]
        [InlineData("Sport Club Internacional", null)]
        [InlineData("MeuPluggy", null)]
        [InlineData("platinum", null)]
        public void BankCatalog_RecognizesBanksByName(string name, string? slug) =>
            Assert.Equal(slug, BankCatalog.Match(name)?.Slug);
    }
}
