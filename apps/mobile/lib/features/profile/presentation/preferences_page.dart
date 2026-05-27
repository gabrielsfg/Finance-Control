import 'package:country_flags/country_flags.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../../core/utils/countries.dart';
import '../../../core/utils/timezones.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/dtos/currency_response_dto.dart';
import '../data/dtos/update_user_preferences_request_dto.dart';
import '../providers/user_preferences_provider.dart';

class PreferencesPage extends ConsumerStatefulWidget {
  const PreferencesPage({super.key});

  @override
  ConsumerState<PreferencesPage> createState() => _PreferencesPageState();
}

class _PreferencesPageState extends ConsumerState<PreferencesPage> {
  String? _selectedCurrency;
  String? _selectedLocale;
  String? _selectedTimezone;
  String? _selectedCountry;
  bool _countryInitialized = false;
  bool _timezoneInitialized = false;
  bool _isSaving = false;
  String? _submitError;

  @override
  void dispose() {
    super.dispose();
  }

  static const _locales = [
    _LocaleOption(code: 'pt-BR', label: 'Português (Brasil)'),
    _LocaleOption(code: 'en-US', label: 'English (US)'),
  ];

  Future<void> _save() async {
    final countryToSend = _selectedCountry;

    setState(() {
      _isSaving = true;
      _submitError = null;
    });

    try {
      // Save timezone locally if it changed
      if (_selectedTimezone != null) {
        final currentTz = ref.read(localSettingsProvider).valueOrNull?.timezone;
        if (_selectedTimezone != currentTz) {
          await ref.read(localSettingsProvider.notifier).setTimezone(_selectedTimezone!);
        }
      }

      // Only call the backend if there's something to update
      if (_selectedCurrency != null || _selectedLocale != null || countryToSend != null) {
        await ref.read(userPreferencesProvider.notifier).updatePreferences(
              UpdateUserPreferencesRequestDto(
                currencyCode: _selectedCurrency,
                locale: _selectedLocale,
                country: countryToSend,
              ),
            );
      }

      if (mounted) context.pop();
    } catch (_) {
      setState(() => _submitError = 'Could not save preferences. Try again.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final prefsAsync = ref.watch(userPreferencesProvider);
    final currenciesAsync = ref.watch(currenciesProvider);

    final currentCurrency =
        _selectedCurrency ?? prefsAsync.valueOrNull?.currencyCode ?? 'BRL';
    final currentLocale =
        _selectedLocale ?? prefsAsync.valueOrNull?.locale ?? 'pt-BR';

    final localSettings = ref.watch(localSettingsProvider).valueOrNull;

    // Initialise country selection from loaded prefs (only once)
    if (!_countryInitialized && prefsAsync.valueOrNull?.country != null) {
      _countryInitialized = true;
      _selectedCountry = prefsAsync.valueOrNull!.country!;
    }

    // Initialise timezone selection from local settings (only once)
    if (!_timezoneInitialized && localSettings != null) {
      _timezoneInitialized = true;
      _selectedTimezone = localSettings.timezone;
    }

    return Scaffold(
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                _buildHeader(context, t),
                const SizedBox(height: 32),
                if (_submitError != null) ...[
                  _ErrorBanner(message: _submitError!),
                  const SizedBox(height: 20),
                ],

                // ── Currency ─────────────────────────────────────────────
                _SectionLabel(title: 'Currency'),
                const SizedBox(height: 10),
                currenciesAsync.when(
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  error: (_, __) => const _InlineError(
                    message: 'Could not load currencies.',
                  ),
                  data: (currencies) => _CurrencySelector(
                    currencies: currencies,
                    selected: currentCurrency,
                    onChanged: (code) =>
                        setState(() => _selectedCurrency = code),
                  ),
                ),

                const SizedBox(height: 28),

                // ── Language ─────────────────────────────────────────────
                _SectionLabel(title: 'Language'),
                const SizedBox(height: 10),
                _LocaleSelector(
                  locales: _locales,
                  selected: currentLocale,
                  onChanged: (locale) =>
                      setState(() => _selectedLocale = locale),
                ),

                const SizedBox(height: 28),

                // ── Theme ────────────────────────────────────────────────
                _SectionLabel(title: 'Theme'),
                const SizedBox(height: 10),
                _ThemeSelector(
                  selected: ref.watch(themeModeProvider),
                  onChanged: (mode) => ref
                      .read(localSettingsProvider.notifier)
                      .setThemeMode(mode),
                ),

                const SizedBox(height: 28),

                // ── Country ──────────────────────────────────────────────
                _SectionLabel(title: 'Country'),
                const SizedBox(height: 10),
                _CountrySelector(
                  selected: _selectedCountry,
                  onChanged: (code) => setState(() => _selectedCountry = code),
                ),

                const SizedBox(height: 28),

                // ── Timezone ─────────────────────────────────────────────
                _SectionLabel(title: 'Timezone'),
                const SizedBox(height: 10),
                _TimezoneSelector(
                  selected: _selectedTimezone ?? localSettings?.timezone ?? 'America/Sao_Paulo',
                  onChanged: (iana) => setState(() => _selectedTimezone = iana),
                ),

                const SizedBox(height: 28),

                // ── First Day of Week ─────────────────────────────────────
                _SectionLabel(title: 'First Day of Week'),
                const SizedBox(height: 10),
                _FirstDaySelector(
                  selected: localSettings?.firstDayOfWeek ?? 0,
                  onChanged: (day) => ref
                      .read(localSettingsProvider.notifier)
                      .setFirstDayOfWeek(day),
                ),

                const SizedBox(height: 32),

                _isSaving
                    ? Center(
                        child: SizedBox(
                          height: 48,
                          child: Center(
                            child: CircularProgressIndicator(
                              color: t.primary,
                              strokeWidth: 2.5,
                            ),
                          ),
                        ),
                      )
                    : PrimaryButton(
                        label: 'Save Preferences',
                        onPressed: _save,
                      ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AppThemeTokens t) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.07)
                  : Colors.black.withValues(alpha: 0.05),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: t.txtPrimary,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Text('Preferences', style: AppTextStyles.h1(t.txtPrimary)),
      ],
    );
  }
}

// ── Section Label ──────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 2),
      child: Text(
        title.toUpperCase(),
        style: AppTextStyles.caption(t.txtTertiary).copyWith(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.0,
        ),
      ),
    );
  }
}

// ── Currency → country (ISO 3166-1 alpha-2) map ──────────────────────────────

const _currencyToCountry = <String, String>{
  'AED': 'AE', 'ARS': 'AR', 'AUD': 'AU', 'BOB': 'BO', 'BRL': 'BR',
  'CAD': 'CA', 'CHF': 'CH', 'CLP': 'CL', 'CNY': 'CN', 'COP': 'CO',
  'DKK': 'DK', 'EUR': 'EU', 'GBP': 'GB', 'GHS': 'GH', 'HKD': 'HK',
  'IDR': 'ID', 'ILS': 'IL', 'INR': 'IN', 'JPY': 'JP', 'KES': 'KE',
  'KRW': 'KR', 'MXN': 'MX', 'MYR': 'MY', 'NGN': 'NG', 'NOK': 'NO',
  'NZD': 'NZ', 'PEN': 'PE', 'PHP': 'PH', 'PYG': 'PY', 'RUB': 'RU',
  'SAR': 'SA', 'SEK': 'SE', 'SGD': 'SG', 'THB': 'TH', 'TRY': 'TR',
  'USD': 'US', 'UYU': 'UY', 'VES': 'VE', 'VND': 'VN', 'ZAR': 'ZA',
};

Widget _currencyFlag(String currencyCode, {double size = 22}) {
  final country = _currencyToCountry[currencyCode];
  if (country == null) {
    return Icon(LucideIcons.dollarSign, size: size);
  }
  return ClipRRect(
    borderRadius: BorderRadius.circular(3),
    child: CountryFlag.fromCountryCode(
      country,
      height: size,
      width: size * 1.4,
    ),
  );
}

// ── Currency Selector ──────────────────────────────────────────────────────

class _CurrencySelector extends StatefulWidget {
  const _CurrencySelector({
    required this.currencies,
    required this.selected,
    required this.onChanged,
  });

  final List<CurrencyResponseDto> currencies;
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  State<_CurrencySelector> createState() => _CurrencySelectorState();
}

class _CurrencySelectorState extends State<_CurrencySelector> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CurrencyResponseDto> _filter(String q) {
    if (q.isEmpty) return widget.currencies;
    final lower = q.toLowerCase();
    return widget.currencies
        .where((c) => c.code.toLowerCase().contains(lower))
        .toList();
  }

  void _openPicker() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) {
          final t = AppThemeTokens.of(ctx);
          var filtered = _filter(_searchController.text);

          return Container(
            height: MediaQuery.of(ctx).size.height * 0.75,
            decoration: BoxDecoration(
              color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: t.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child:
                      Text('Select Currency', style: AppTextStyles.h3(t.txtPrimary)),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _searchController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Search currency code...',
                      hintStyle: AppTextStyles.bodySm(t.txtTertiary),
                      prefixIcon:
                          Icon(Icons.search, size: 18, color: t.txtTertiary),
                      filled: true,
                      fillColor: t.isDark
                          ? Colors.white.withValues(alpha: 0.06)
                          : Colors.black.withValues(alpha: 0.04),
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (q) {
                      setModal(() => filtered = _filter(q));
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => Divider(
                      height: 1,
                      thickness: 1,
                      indent: 16,
                      endIndent: 16,
                      color: t.divider.withValues(alpha: 0.3),
                    ),
                    itemBuilder: (_, i) {
                      final currency = filtered[i];
                      final isSelected = currency.code == widget.selected;
                      return GestureDetector(
                        onTap: () {
                          widget.onChanged(currency.code);
                          _searchController.clear();
                          Navigator.of(context).pop();
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 14),
                          child: Row(
                            children: [
                              _currencyFlag(currency.code, size: 22),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      currency.code,
                                      style: AppTextStyles.body(
                                        isSelected ? t.primary : t.txtPrimary,
                                      ).copyWith(
                                        fontWeight: isSelected
                                            ? FontWeight.w700
                                            : FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 1),
                                    Text(
                                      '1 USD = ${currency.rate.toStringAsFixed(4)} ${currency.code}',
                                      style: AppTextStyles.caption(t.txtTertiary)
                                          .copyWith(fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              if (isSelected)
                                Icon(Icons.check_rounded,
                                    size: 18, color: t.primary)
                              else
                                const SizedBox(width: 18),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: _openPicker,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: t.isDark
              ? const Color(0xFF1C1830).withValues(alpha: 0.72)
              : Colors.white.withValues(alpha: 0.9),
          borderRadius: AppRadius.xlAll,
          border: Border.all(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.07)
                : const Color(0xFF7C3AED).withValues(alpha: 0.12),
          ),
        ),
        child: Row(
          children: [
            _currencyFlag(widget.selected, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.selected,
                style: AppTextStyles.body(t.txtPrimary).copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 20, color: t.txtTertiary),
          ],
        ),
      ),
    );
  }
}

// ── Locale Selector ────────────────────────────────────────────────────────

class _LocaleOption {
  const _LocaleOption({required this.code, required this.label});
  final String code;
  final String label;
}

class _LocaleSelector extends StatelessWidget {
  const _LocaleSelector({
    required this.locales,
    required this.selected,
    required this.onChanged,
  });

  final List<_LocaleOption> locales;
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Container(
      decoration: BoxDecoration(
        color: t.isDark
            ? const Color(0xFF1C1830).withValues(alpha: 0.72)
            : Colors.white.withValues(alpha: 0.9),
        borderRadius: AppRadius.xlAll,
        border: Border.all(
          color: t.isDark
              ? Colors.white.withValues(alpha: 0.07)
              : const Color(0xFF7C3AED).withValues(alpha: 0.12),
        ),
      ),
      child: Column(
        children: List.generate(locales.length, (i) {
          final locale = locales[i];
          final isSelected = locale.code == selected;
          final isLast = i == locales.length - 1;

          return Column(
            children: [
              GestureDetector(
                onTap: () => onChanged(locale.code),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          locale.label,
                          style: AppTextStyles.body(
                            isSelected ? t.primary : t.txtPrimary,
                          ).copyWith(
                            fontWeight:
                                isSelected ? FontWeight.w600 : FontWeight.w400,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      if (isSelected)
                        Icon(LucideIcons.check, size: 16, color: t.primary)
                      else
                        const SizedBox(width: 16),
                    ],
                  ),
                ),
              ),
              if (!isLast)
                Divider(
                  height: 1,
                  thickness: 1,
                  indent: 16,
                  endIndent: 16,
                  color: t.divider.withValues(alpha: 0.3),
                ),
            ],
          );
        }),
      ),
    );
  }
}

// ── Theme Selector ─────────────────────────────────────────────────────────

class _ThemeSelector extends StatelessWidget {
  const _ThemeSelector({required this.selected, required this.onChanged});

  final ThemeMode selected;
  final ValueChanged<ThemeMode> onChanged;

  static const _options = [
    (mode: ThemeMode.system, label: 'System', icon: LucideIcons.monitor),
    (mode: ThemeMode.light, label: 'Light', icon: LucideIcons.sun),
    (mode: ThemeMode.dark, label: 'Dark', icon: LucideIcons.moon),
  ];

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      children: _options.map((opt) {
        final isSelected = opt.mode == selected;
        final isLast = opt == _options.last;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(opt.mode),
            child: Container(
              margin: EdgeInsets.only(right: isLast ? 0 : 8),
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: isSelected
                    ? t.primary.withValues(alpha: t.isDark ? 0.2 : 0.1)
                    : t.isDark
                        ? Colors.white.withValues(alpha: 0.05)
                        : Colors.white.withValues(alpha: 0.8),
                borderRadius: AppRadius.mdAll,
                border: Border.all(
                  color: isSelected
                      ? t.primary.withValues(alpha: 0.6)
                      : t.divider.withValues(alpha: 0.4),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    opt.icon,
                    size: 18,
                    color: isSelected ? t.primary : t.txtTertiary,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    opt.label,
                    style: AppTextStyles.caption(
                      isSelected ? t.primary : t.txtSecondary,
                    ).copyWith(
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── First Day of Week Selector ─────────────────────────────────────────────

class _FirstDaySelector extends StatelessWidget {
  const _FirstDaySelector({required this.selected, required this.onChanged});

  final int selected;
  final ValueChanged<int> onChanged;

  static const _days = [
    (index: 0, label: 'Sun'),
    (index: 1, label: 'Mon'),
    (index: 2, label: 'Tue'),
    (index: 3, label: 'Wed'),
    (index: 4, label: 'Thu'),
    (index: 5, label: 'Fri'),
    (index: 6, label: 'Sat'),
  ];

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      children: _days.map((day) {
        final isSelected = day.index == selected;
        final isLast = day.index == 6;
        return Expanded(
          child: GestureDetector(
            onTap: () => onChanged(day.index),
            child: Container(
              margin: EdgeInsets.only(right: isLast ? 0 : 6),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: isSelected
                    ? t.primary.withValues(alpha: t.isDark ? 0.2 : 0.1)
                    : t.isDark
                        ? Colors.white.withValues(alpha: 0.05)
                        : Colors.white.withValues(alpha: 0.8),
                borderRadius: AppRadius.mdAll,
                border: Border.all(
                  color: isSelected
                      ? t.primary.withValues(alpha: 0.6)
                      : t.divider.withValues(alpha: 0.4),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Text(
                day.label,
                textAlign: TextAlign.center,
                style: AppTextStyles.caption(
                  isSelected ? t.primary : t.txtSecondary,
                ).copyWith(
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 10,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Country Selector ───────────────────────────────────────────────────────

class _CountrySelector extends StatefulWidget {
  const _CountrySelector({required this.selected, required this.onChanged});

  final String? selected;
  final ValueChanged<String> onChanged;

  @override
  State<_CountrySelector> createState() => _CountrySelectorState();
}

class _CountrySelectorState extends State<_CountrySelector> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CountryOption> _filter(String q) {
    if (q.isEmpty) return kCountries;
    final lower = q.toLowerCase();
    return kCountries
        .where((c) =>
            c.name.toLowerCase().contains(lower) ||
            c.code.toLowerCase().contains(lower))
        .toList();
  }

  void _openPicker() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) {
          final t = AppThemeTokens.of(ctx);
          var filtered = _filter(_searchController.text);

          return Container(
            height: MediaQuery.of(ctx).size.height * 0.75,
            decoration: BoxDecoration(
              color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: t.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text('Select Country',
                      style: AppTextStyles.h3(t.txtPrimary)),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _searchController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Search country...',
                      hintStyle: AppTextStyles.bodySm(t.txtTertiary),
                      prefixIcon:
                          Icon(Icons.search, size: 18, color: t.txtTertiary),
                      filled: true,
                      fillColor: t.isDark
                          ? Colors.white.withValues(alpha: 0.06)
                          : Colors.black.withValues(alpha: 0.04),
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (q) => setModal(() => filtered = _filter(q)),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => Divider(
                      height: 1,
                      thickness: 1,
                      indent: 16,
                      endIndent: 16,
                      color: t.divider.withValues(alpha: 0.3),
                    ),
                    itemBuilder: (_, i) {
                      final country = filtered[i];
                      final isSelected = country.code == widget.selected;
                      return GestureDetector(
                        onTap: () {
                          widget.onChanged(country.code);
                          _searchController.clear();
                          Navigator.of(context).pop();
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 14),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: CountryFlag.fromCountryCode(
                                  country.code,
                                  height: 22,
                                  width: 30,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  country.name,
                                  style: AppTextStyles.body(
                                    isSelected ? t.primary : t.txtPrimary,
                                  ).copyWith(
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              Text(
                                country.code,
                                style: AppTextStyles.caption(t.txtTertiary)
                                    .copyWith(fontSize: 12),
                              ),
                              const SizedBox(width: 8),
                              if (isSelected)
                                Icon(Icons.check_rounded,
                                    size: 18, color: t.primary)
                              else
                                const SizedBox(width: 18),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final country = widget.selected != null
        ? countryByCode(widget.selected!)
        : null;

    return GestureDetector(
      onTap: _openPicker,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: t.isDark
              ? const Color(0xFF1C1830).withValues(alpha: 0.72)
              : Colors.white.withValues(alpha: 0.9),
          borderRadius: AppRadius.xlAll,
          border: Border.all(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.07)
                : const Color(0xFF7C3AED).withValues(alpha: 0.12),
          ),
        ),
        child: Row(
          children: [
            if (country != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: CountryFlag.fromCountryCode(
                  country.code,
                  height: 24,
                  width: 34,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  country.name,
                  style: AppTextStyles.body(t.txtPrimary).copyWith(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ),
            ] else
              Expanded(
                child: Text(
                  'Select your country',
                  style: AppTextStyles.body(t.txtTertiary)
                      .copyWith(fontSize: 14),
                ),
              ),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 20, color: t.txtTertiary),
          ],
        ),
      ),
    );
  }
}

// ── Timezone Selector ──────────────────────────────────────────────────────

class _TimezoneSelector extends StatefulWidget {
  const _TimezoneSelector({required this.selected, required this.onChanged});

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  State<_TimezoneSelector> createState() => _TimezoneSelectorState();
}

class _TimezoneSelectorState extends State<_TimezoneSelector> {
  final _searchController = TextEditingController();
  List<TimezoneOption> _filtered = kTimezonesAlphabetical;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String q) {
    final lower = q.toLowerCase();
    setState(() {
      _filtered = lower.isEmpty
          ? kTimezonesAlphabetical
          : kTimezonesAlphabetical
              .where((tz) =>
                  tz.label.toLowerCase().contains(lower) ||
                  tz.iana.toLowerCase().contains(lower) ||
                  tz.offset.toLowerCase().contains(lower))
              .toList();
    });
  }

  void _openPicker() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) {
          final t = AppThemeTokens.of(ctx);
          return Container(
            height: MediaQuery.of(ctx).size.height * 0.75,
            decoration: BoxDecoration(
              color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: t.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Select Timezone',
                    style: AppTextStyles.h3(t.txtPrimary),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _searchController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Search by city or offset...',
                      hintStyle: AppTextStyles.bodySm(t.txtTertiary),
                      prefixIcon: Icon(Icons.search, size: 18, color: t.txtTertiary),
                      filled: true,
                      fillColor: t.isDark
                          ? Colors.white.withValues(alpha: 0.06)
                          : Colors.black.withValues(alpha: 0.04),
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (q) {
                      _onSearch(q);
                      setModal(() {});
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.separated(
                    itemCount: _filtered.length,
                    separatorBuilder: (_, _) => Divider(
                      height: 1,
                      thickness: 1,
                      indent: 16,
                      endIndent: 16,
                      color: t.divider.withValues(alpha: 0.3),
                    ),
                    itemBuilder: (_, i) {
                      final tz = _filtered[i];
                      final isSelected = tz.iana == widget.selected;
                      return GestureDetector(
                        onTap: () {
                          widget.onChanged(tz.iana);
                          _searchController.clear();
                          _onSearch('');
                          Navigator.of(context).pop();
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 14,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      tz.label,
                                      style: AppTextStyles.body(
                                        isSelected ? t.primary : t.txtPrimary,
                                      ).copyWith(
                                        fontWeight: isSelected
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${tz.iana} · ${tz.offset}',
                                      style: AppTextStyles.caption(t.txtTertiary)
                                          .copyWith(fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              if (isSelected)
                                Icon(Icons.check_rounded, size: 18, color: t.primary)
                              else
                                const SizedBox(width: 18),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final current = timezoneByIana(widget.selected);
    final displayLabel = current?.label ?? widget.selected;
    final displayOffset = current?.offset ?? '';

    return GestureDetector(
      onTap: _openPicker,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: t.isDark
              ? const Color(0xFF1C1830).withValues(alpha: 0.72)
              : Colors.white.withValues(alpha: 0.9),
          borderRadius: AppRadius.xlAll,
          border: Border.all(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.07)
                : const Color(0xFF7C3AED).withValues(alpha: 0.12),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayLabel,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  if (displayOffset.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      '${widget.selected} · $displayOffset',
                      style: AppTextStyles.caption(t.txtTertiary)
                          .copyWith(fontSize: 11),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: t.txtTertiary),
          ],
        ),
      ),
    );
  }
}

// ── Error widgets ──────────────────────────────────────────────────────────

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: t.error.withValues(alpha: t.isDark ? 0.15 : 0.08),
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.error.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: t.error, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: AppTextStyles.bodySm(t.error)),
          ),
        ],
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(message, style: AppTextStyles.bodySm(t.error)),
    );
  }
}
