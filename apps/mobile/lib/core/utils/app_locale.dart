import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/theme_mode_provider.dart';
import '../../features/profile/providers/user_preferences_provider.dart';

// ── AppLocale ──────────────────────────────────────────────────────────────
//
// Immutable snapshot of the user's locale/formatting preferences.
// Derive once per provider rebuild, then pass or read via AppLocaleScope.

class AppLocale {
  const AppLocale({
    required this.currencyCode,
    required this.currencySymbol,
    required this.locale,
    required this.country,
    required this.timezone,
    required this.firstDayOfWeek,
  });

  /// e.g. "BRL", "USD", "EUR"
  final String currencyCode;

  /// e.g. "R$", "$", "€"
  final String currencySymbol;

  /// BCP 47 locale tag, e.g. "pt-BR", "en-US"
  final String locale;

  /// ISO 3166-1 alpha-2, e.g. "BR", "US". May be null/empty.
  final String country;

  /// IANA timezone, e.g. "America/Sao_Paulo"
  final String timezone;

  /// 0 = Sunday, 1 = Monday, …, 6 = Saturday
  final int firstDayOfWeek;

  // ── Derived helpers ──────────────────────────────────────────────────────

  /// Whether this locale uses comma as decimal separator (pt-BR style).
  /// en-US uses period; pt-BR uses comma.
  bool get _usesCommaSeparator => locale.startsWith('pt');

  // ── Currency formatting ──────────────────────────────────────────────────

  /// Formats [cents] as a currency string using the user's currency symbol
  /// and locale-appropriate separators.
  ///
  /// Examples (pt-BR, BRL):  13212  → "R$ 132,12"
  /// Examples (en-US, USD):  13212  → "$ 132.12"
  String formatCurrency(int cents) {
    final absStr = (cents.abs() / 100).toStringAsFixed(2);
    final parts = absStr.split('.');
    final intPart = _groupThousands(parts[0]);
    final decPart = parts[1];

    final String formatted;
    if (_usesCommaSeparator) {
      formatted = '$intPart,$decPart';
    } else {
      formatted = '$intPart.$decPart';
    }

    final sign = cents < 0 ? '-' : '';
    return '$sign$currencySymbol $formatted';
  }

  /// Formats [cents] with an explicit sign prefix: "+R$ 1,00" / "-R$ 1,00".
  String formatCurrencySigned(int cents) {
    final sign = cents >= 0 ? '+' : '-';
    final absStr = (cents.abs() / 100).toStringAsFixed(2);
    final parts = absStr.split('.');
    final intPart = _groupThousands(parts[0]);
    final decPart = parts[1];
    final formatted = _usesCommaSeparator ? '$intPart,$decPart' : '$intPart.$decPart';
    return '$sign$currencySymbol $formatted';
  }

  String _groupThousands(String intStr) {
    final sep = _usesCommaSeparator ? '.' : ',';
    final buf = StringBuffer();
    for (var i = 0; i < intStr.length; i++) {
      if (i > 0 && (intStr.length - i) % 3 == 0) buf.write(sep);
      buf.write(intStr[i]);
    }
    return buf.toString();
  }

  // ── Date formatting ──────────────────────────────────────────────────────

  /// Short date: "18/02/2026" (pt-BR) or "02/18/2026" (en-US).
  String formatDate(DateTime date) {
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    final y = date.year.toString();
    return _usesCommaSeparator ? '$d/$m/$y' : '$m/$d/$y';
  }

  /// Day + abbreviated month: "19 FEV" (pt-BR) or "FEB 19" (en-US).
  String formatDayHeader(DateTime date) {
    final abbr = _shortMonthAbbr(date.month).toUpperCase();
    if (_usesCommaSeparator) return '${date.day} $abbr';
    return '$abbr ${date.day}';
  }

  /// Full month + year: "Fevereiro 2026" (pt-BR) or "February 2026" (en-US).
  String formatMonthYear(DateTime date) =>
      '${_fullMonthName(date.month)} ${date.year}';

  /// Full month name.
  String monthName(int month) => _fullMonthName(month);

  /// Short month abbreviation (3 letters).
  String shortMonthName(int month) => _shortMonthAbbr(month);

  // ── Weekday helpers ──────────────────────────────────────────────────────

  /// Ordered list of weekday names starting from [firstDayOfWeek].
  /// 0 = Sun, 1 = Mon, …, 6 = Sat.
  List<String> get weekdayLabels {
    final all = _usesCommaSeparator
        ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [
      ...all.sublist(firstDayOfWeek),
      ...all.sublist(0, firstDayOfWeek),
    ];
  }

  // ── Private month name tables ────────────────────────────────────────────

  static const _ptFullMonths = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  static const _enFullMonths = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  static const _ptShortMonths = [
    '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  static const _enShortMonths = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  String _fullMonthName(int month) =>
      _usesCommaSeparator ? _ptFullMonths[month] : _enFullMonths[month];

  String _shortMonthAbbr(int month) =>
      _usesCommaSeparator ? _ptShortMonths[month] : _enShortMonths[month];

  // ── Default fallback ─────────────────────────────────────────────────────

  static const defaultLocale = AppLocale(
    currencyCode: 'BRL',
    currencySymbol: r'R$',
    locale: 'pt-BR',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    firstDayOfWeek: 0,
  );
}

// ── Currency symbol map ────────────────────────────────────────────────────

/// Maps ISO 4217 currency codes to their common display symbols.
/// Falls back to the code itself when not found.
String currencySymbolFor(String code) {
  const map = {
    'BRL': r'R$',
    'USD': r'$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'ARS': r'$',
    'CLP': r'$',
    'COP': r'$',
    'MXN': r'$',
    'PEN': 'S/',
    'UYU': r'$U',
    'PYG': '₲',
    'BOB': 'Bs.',
    'VES': 'Bs.S',
    'CAD': r'CA$',
    'AUD': r'A$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'INR': '₹',
    'KRW': '₩',
    'SGD': r'S$',
    'HKD': r'HK$',
    'NZD': r'NZ$',
    'ZAR': 'R',
    'RUB': '₽',
    'TRY': '₺',
    'SAR': '﷼',
    'AED': 'د.إ',
    'ILS': '₪',
    'MYR': 'RM',
    'IDR': 'Rp',
    'THB': '฿',
    'PHP': '₱',
    'VND': '₫',
    'NGN': '₦',
    'KES': 'Ksh',
    'GHS': 'GH₵',
  };
  return map[code] ?? code;
}

// ── AppLocaleScope (InheritedWidget) ──────────────────────────────────────

class AppLocaleScope extends InheritedWidget {
  const AppLocaleScope({
    super.key,
    required this.locale,
    required super.child,
  });

  final AppLocale locale;

  static AppLocale of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<AppLocaleScope>();
    return scope?.locale ?? AppLocale.defaultLocale;
  }

  @override
  bool updateShouldNotify(AppLocaleScope oldWidget) =>
      locale != oldWidget.locale;
}

// ── Provider ──────────────────────────────────────────────────────────────

final appLocaleProvider = Provider<AppLocale>((ref) {
  final prefs = ref.watch(userPreferencesProvider).valueOrNull;
  final localSettings = ref.watch(localSettingsProvider).valueOrNull;

  final currencyCode = prefs?.currencyCode ?? 'BRL';
  final locale = prefs?.locale ?? 'pt-BR';
  final country = prefs?.country ?? 'BR';
  final timezone = localSettings?.timezone ?? 'America/Sao_Paulo';
  final firstDayOfWeek = localSettings?.firstDayOfWeek ?? 0;

  return AppLocale(
    currencyCode: currencyCode,
    currencySymbol: currencySymbolFor(currencyCode),
    locale: locale,
    country: country,
    timezone: timezone,
    firstDayOfWeek: firstDayOfWeek,
  );
});
