/// Shifts a reference date by [steps] budget-recurrence periods. Used to
/// navigate to the previous/next budget period. Matches the backend
/// `EnumBudgetRecurrence` values (Weekly/Biweekly/Monthly/Semiannually/Annually).
DateTime shiftBudgetPeriod(DateTime from, String recurrence, int steps) {
  switch (recurrence) {
    case 'Weekly':
      return from.add(Duration(days: 7 * steps));
    case 'Biweekly':
      return from.add(Duration(days: 14 * steps));
    case 'Semiannually':
      return _addMonths(from, 6 * steps);
    case 'Annually':
      return _addMonths(from, 12 * steps);
    case 'Monthly':
    default:
      return _addMonths(from, steps);
  }
}

DateTime _addMonths(DateTime from, int months) {
  var year = from.year;
  var month = from.month + months;
  while (month > 12) {
    month -= 12;
    year++;
  }
  while (month < 1) {
    month += 12;
    year--;
  }
  final lastDay = DateTime(year, month + 1, 0).day;
  final day = from.day > lastDay ? lastDay : from.day;
  return DateTime(year, month, day);
}
