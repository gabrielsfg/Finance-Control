/// App-wide formatting utilities.
///
/// All formatting logic for currency, dates, percentages, and labels must live
/// here. Never define formatting functions inside a page or widget file.
///
/// Prefer using [AppLocale] (via [AppLocaleScope.of(context)]) directly in
/// widgets so that formatting automatically adapts to the user's locale.
/// The free functions below are kept for call sites that don't have access to
/// a BuildContext (e.g. repositories, notifiers).
library;

import 'package:flutter/services.dart';

import 'app_locale.dart';

// ── CentsInputFormatter ────────────────────────────────────────────────────

/// A [TextInputFormatter] that formats monetary input as cents-based currency.
///
/// The user types only digits (and optionally a leading `-` when [allowNegative]
/// is true). The formatter automatically inserts the decimal separator so that
/// the last two digits are always the cent portion.
///
/// Uses pt-BR separators by default (comma decimal, period thousands).
/// Pass [locale] (e.g. "en-US") to switch to period decimal / comma thousands.
///
/// Examples (pt-BR):
///   typing "4"     → "0,04"
///   typing "43"    → "0,43"
///   typing "432"   → "4,32"
///   typing "43254" → "432,54"
class CentsInputFormatter extends TextInputFormatter {
  const CentsInputFormatter({
    this.allowNegative = false,
    this.locale = 'pt-BR',
  });

  final bool allowNegative;

  /// BCP 47 locale tag used to pick decimal/thousands separators.
  final String locale;

  bool get _useCommaDecimal => locale.startsWith('pt');

  /// Parses a formatted string (e.g. "-1.234,56" or "-1,234.56") back to cents.
  static int parseCents(String formatted) {
    final isNegative = formatted.startsWith('-');
    final digits = formatted.replaceAll(RegExp(r'[^\d]'), '');
    final value = int.tryParse(digits) ?? 0;
    return isNegative ? -value : value;
  }

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final raw = newValue.text;
    final isNegative = allowNegative && raw.startsWith('-');
    final digits = raw.replaceAll(RegExp(r'[^\d]'), '');

    if (isNegative && digits.isEmpty) {
      return const TextEditingValue(
        text: '-',
        selection: TextSelection.collapsed(offset: 1),
      );
    }

    final formatted = _format(digits, isNegative, _useCommaDecimal);

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }

  static String _format(String digits, bool isNegative, bool commaDecimal) {
    if (digits.isEmpty) return '';

    final padded = digits.padLeft(3, '0');
    final rawInt = padded.substring(0, padded.length - 2);
    final centPart = padded.substring(padded.length - 2);

    final intPart = rawInt.replaceFirst(RegExp(r'^0+'), '').isEmpty
        ? '0'
        : rawInt.replaceFirst(RegExp(r'^0+'), '');

    final thousandsSep = commaDecimal ? '.' : ',';
    final decimalSep = commaDecimal ? ',' : '.';

    final buf = StringBuffer();
    for (var i = 0; i < intPart.length; i++) {
      if (i > 0 && (intPart.length - i) % 3 == 0) buf.write(thousandsSep);
      buf.write(intPart[i]);
    }

    final result = '$buf$decimalSep$centPart';
    return isNegative ? '-$result' : result;
  }
}

// ── Convenience free functions (delegate to AppLocale.defaultLocale) ───────
//
// These exist for backward-compatibility and for code that runs outside a
// widget tree (providers, repositories). In widgets, prefer:
//   final fmt = AppLocaleScope.of(context);
//   fmt.formatCurrency(cents);

/// Formats [cents] as a currency string.
/// Defaults to BRL / pt-BR formatting. Prefer [AppLocale.formatCurrency] in widgets.
String formatCurrency(int cents, {String currencySymbol = r'R$'}) {
  // Honour explicit override (used in wishlist pre-fill logic, etc.)
  final locale = AppLocale(
    currencyCode: 'BRL',
    currencySymbol: currencySymbol,
    locale: 'pt-BR',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    firstDayOfWeek: 0,
  );
  return locale.formatCurrency(cents);
}

/// Returns the full month name in pt-BR.
/// Prefer [AppLocale.monthName] in widgets.
String monthName(int month) => AppLocale.defaultLocale.monthName(month);

/// Returns the abbreviated month name in pt-BR.
/// Prefer [AppLocale.shortMonthName] in widgets.
String shortMonthName(int month) =>
    AppLocale.defaultLocale.shortMonthName(month);

/// Returns a formatted day header like "19 FEV" in pt-BR.
/// Prefer [AppLocale.formatDayHeader] in widgets.
String formatDayHeader(DateTime date) =>
    AppLocale.defaultLocale.formatDayHeader(date);

/// Returns a formatted month/year string like "Fevereiro 2026" in pt-BR.
/// Prefer [AppLocale.formatMonthYear] in widgets.
String formatMonthYear(DateTime date) =>
    AppLocale.defaultLocale.formatMonthYear(date);

/// Returns a formatted date string like "18/02/2026" in pt-BR.
/// Prefer [AppLocale.formatDate] in widgets.
String formatDate(DateTime date) => AppLocale.defaultLocale.formatDate(date);

/// Maps a backend RecurrenceType wire value (e.g. "Monthly") to its pt-BR
/// display label. The wire value is still what gets sent to / stored by the
/// API — this is display-only. Unknown values fall back to the input.
String recurrenceLabelPt(String wire) {
  const map = {
    'None': 'Nenhuma',
    'Daily': 'Diária',
    'WorkDay': 'Dias úteis',
    'Weekly': 'Semanal',
    'Biweekly': 'Quinzenal',
    'Monthly': 'Mensal',
    'Quarterly': 'Trimestral',
    'Semiannually': 'Semestral',
    'Annually': 'Anual',
  };
  return map[wire] ?? wire;
}
