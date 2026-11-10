using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Services.Helpers
{
    /// <summary>
    /// Splits a card's balance into bills by its closing and due days.
    /// </summary>
    /// <remarks>
    /// A bill closing on day C holds what was bought from the previous closing date up to
    /// the day before C; a purchase on the closing day goes to the next bill. It is due on
    /// day D of the same month when D is after C, otherwise of the next month. Days past the
    /// end of a short month fall on its last day.
    ///
    /// Movements are signed as the balance is (purchases negative, payments and refunds
    /// positive). Payments made after a bill closed pay that bill first; what is left over
    /// lowers the open one. Installments dated in coming months make up the upcoming bills.
    /// </remarks>
    public static class CreditCardBillCalculator
    {
        public const int MaxUpcomingBills = 24;

        public static CreditCardBillsResponseDto Calculate(
            int closingDay, int dueDay, DateOnly today, IEnumerable<(DateOnly Date, int Amount)> movements)
        {
            var list = movements.ToList();

            // The open bill closes on the first closing date after today.
            var nextClosing = ClosingDate(today.Year, today.Month, closingDay);
            if (nextClosing <= today)
                nextClosing = ClosingDate(today.AddMonths(1).Year, today.AddMonths(1).Month, closingDay);
            var lastClosing = PreviousClosing(nextClosing, closingDay);

            // Everything before the last closing is the closed bill (and whatever was left
            // unpaid before it).
            var closedOwed = Math.Max(0, -list.Where(m => m.Date < lastClosing).Sum(m => m.Amount));

            var cycle = list.Where(m => m.Date >= lastClosing && m.Date < nextClosing).ToList();
            var charges = -cycle.Where(m => m.Amount < 0).Sum(m => m.Amount);
            var credits = cycle.Where(m => m.Amount > 0).Sum(m => m.Amount);

            var closedLeft = Math.Max(0, closedOwed - credits);
            var extraCredit = Math.Max(0, credits - closedOwed);

            var result = new CreditCardBillsResponseDto
            {
                ClosedBill = closedLeft > 0
                    ? new CreditCardBillResponseDto
                    {
                        ClosingDate = lastClosing,
                        DueDate = DueDate(lastClosing, closingDay, dueDay),
                        Amount = closedLeft
                    }
                    : null,
                CurrentBill = new CreditCardBillResponseDto
                {
                    ClosingDate = nextClosing,
                    DueDate = DueDate(nextClosing, closingDay, dueDay),
                    Amount = Math.Max(0, charges - extraCredit)
                }
            };

            // Each later cycle on its own: what is dated in it, net of credits in it.
            var lastDate = list.Count == 0 ? nextClosing : list.Max(m => m.Date);
            var start = nextClosing;
            for (var i = 0; i < MaxUpcomingBills && start <= lastDate; i++)
            {
                var end = NextClosing(start, closingDay);
                var amount = Math.Max(0, -list.Where(m => m.Date >= start && m.Date < end).Sum(m => m.Amount));
                if (amount > 0)
                    result.UpcomingBills.Add(new CreditCardBillResponseDto
                    {
                        ClosingDate = end,
                        DueDate = DueDate(end, closingDay, dueDay),
                        Amount = amount
                    });
                start = end;
            }

            return result;
        }

        private static DateOnly ClosingDate(int year, int month, int day) =>
            new(year, month, Math.Min(day, DateTime.DaysInMonth(year, month)));

        private static DateOnly NextClosing(DateOnly closing, int closingDay)
        {
            var next = closing.AddMonths(1);
            return ClosingDate(next.Year, next.Month, closingDay);
        }

        private static DateOnly PreviousClosing(DateOnly closing, int closingDay)
        {
            var previous = closing.AddMonths(-1);
            return ClosingDate(previous.Year, previous.Month, closingDay);
        }

        private static DateOnly DueDate(DateOnly closing, int closingDay, int dueDay)
        {
            var month = dueDay > closingDay ? closing : closing.AddMonths(1);
            return new DateOnly(month.Year, month.Month, Math.Min(dueDay, DateTime.DaysInMonth(month.Year, month.Month)));
        }
    }
}
