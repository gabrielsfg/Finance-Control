/// App-wide formatting utilities.
///
/// All formatting logic for currency, dates, percentages, and labels must live
/// here. Never define formatting functions inside a page or widget file.
library;

/// Formats an integer amount in cents to the Brazilian Real format.
///
/// Examples:
///   formatCurrency(384752)  → "R$ 3.847,52"
///   formatCurrency(100)     → "R$ 1,00"
///   formatCurrency(-6790)   → "R$ 67,90"  (sign is the caller's responsibility)
String formatCurrency(int cents) {
  final str = (cents.abs() / 100).toStringAsFixed(2);
  final parts = str.split('.');
  final integerPart = parts[0];
  final buf = StringBuffer();
  for (var i = 0; i < integerPart.length; i++) {
    if (i > 0 && (integerPart.length - i) % 3 == 0) buf.write('.');
    buf.write(integerPart[i]);
  }
  return 'R\$ $buf,${parts[1]}';
}

/// Returns the full Portuguese month name for the given 1-based month number.
///
/// Used for UI display only (product copy — Portuguese is intentional here).
String monthName(int month) => const [
      '',
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ][month];

/// Returns the abbreviated Portuguese month name for the given 1-based month number.
///
/// Examples: 1 → "Jan", 2 → "Fev", 3 → "Mar"
String shortMonthName(int month) => const [
      '',
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ][month];

/// Returns a formatted date string like "19 FEV" for use in transaction group headers.
String formatDayHeader(DateTime date) {
  return '${date.day} ${shortMonthName(date.month).toUpperCase()}';
}

/// Returns a formatted month/year string like "Fevereiro 2026".
String formatMonthYear(DateTime date) => '${monthName(date.month)} ${date.year}';

/// Returns a formatted date string like "18/02/2026".
String formatDate(DateTime date) =>
    '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
