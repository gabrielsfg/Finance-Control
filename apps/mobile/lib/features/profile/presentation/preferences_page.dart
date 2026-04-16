import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/theme_mode_provider.dart';
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
  bool _countryInitialized = false;
  bool _timezoneInitialized = false;
  bool _isSaving = false;
  String? _submitError;

  final _countryController = TextEditingController();
  final _timezoneController = TextEditingController();

  @override
  void dispose() {
    _countryController.dispose();
    _timezoneController.dispose();
    super.dispose();
  }

  static const _locales = [
    _LocaleOption(code: 'pt-BR', label: 'Português (Brasil)'),
    _LocaleOption(code: 'en-US', label: 'English (US)'),
  ];

  Future<void> _save() async {
    final countryValue = _countryController.text.trim().toUpperCase();
    if (countryValue.isNotEmpty && countryValue.length != 2) {
      setState(() => _submitError = 'Country must be a 2-letter ISO code (e.g. BR, US).');
      return;
    }

    final countryToSend = countryValue.isEmpty ? null : countryValue;
    final timezoneValue = _timezoneController.text.trim();

    setState(() {
      _isSaving = true;
      _submitError = null;
    });

    try {
      // Save timezone locally if it changed
      if (timezoneValue.isNotEmpty) {
        final currentTz = ref.read(localSettingsProvider).valueOrNull?.timezone;
        if (timezoneValue != currentTz) {
          await ref.read(localSettingsProvider.notifier).setTimezone(timezoneValue);
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

    // Initialise country field from loaded prefs (only once)
    if (!_countryInitialized && prefsAsync.valueOrNull?.country != null) {
      _countryInitialized = true;
      _countryController.text = prefsAsync.valueOrNull!.country!;
    }

    // Initialise timezone field from local settings (only once)
    if (!_timezoneInitialized && localSettings != null) {
      _timezoneInitialized = true;
      _timezoneController.text = localSettings.timezone;
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
                AppInputField(
                  placeholder: 'ISO 3166-1 alpha-2 (e.g. BR, US)',
                  controller: _countryController,
                  keyboardType: TextInputType.text,
                  textCapitalization: TextCapitalization.characters,
                  textInputAction: TextInputAction.done,
                ),

                const SizedBox(height: 28),

                // ── Timezone ─────────────────────────────────────────────
                _SectionLabel(title: 'Timezone'),
                const SizedBox(height: 10),
                AppInputField(
                  placeholder: 'IANA timezone (e.g. America/Sao_Paulo)',
                  controller: _timezoneController,
                  keyboardType: TextInputType.text,
                  textInputAction: TextInputAction.done,
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.only(left: 2),
                  child: Text(
                    'Used for date grouping and day boundaries.',
                    style: AppTextStyles.caption(
                      AppThemeTokens.of(context).txtTertiary,
                    ).copyWith(fontSize: 11),
                  ),
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

// ── Currency Selector ──────────────────────────────────────────────────────

class _CurrencySelector extends ConsumerStatefulWidget {
  const _CurrencySelector({
    required this.currencies,
    required this.selected,
    required this.onChanged,
  });

  final List<CurrencyResponseDto> currencies;
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  ConsumerState<_CurrencySelector> createState() => _CurrencySelectorState();
}

class _CurrencySelectorState extends ConsumerState<_CurrencySelector> {
  final _searchController = TextEditingController();
  List<CurrencyResponseDto> _filtered = [];

  @override
  void initState() {
    super.initState();
    _filtered = widget.currencies;
    _searchController.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch() {
    final q = _searchController.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? widget.currencies
          : widget.currencies
              .where((c) => c.code.toLowerCase().contains(q))
              .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        AppInputField(
          placeholder: 'Search currency...',
          controller: _searchController,
          leftIcon: Icon(LucideIcons.search, size: 16, color: t.txtTertiary),
        ),
        const SizedBox(height: 10),
        Container(
          constraints: const BoxConstraints(maxHeight: 240),
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
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: _filtered.length,
            separatorBuilder: (_, _) => Divider(
              height: 1,
              thickness: 1,
              indent: 16,
              endIndent: 16,
              color: t.divider.withValues(alpha: 0.3),
            ),
            itemBuilder: (_, i) {
              final currency = _filtered[i];
              final isSelected = currency.code == widget.selected;
              return GestureDetector(
                onTap: () => widget.onChanged(currency.code),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 52,
                        child: Text(
                          currency.code,
                          style: AppTextStyles.body(
                            isSelected ? t.primary : t.txtPrimary,
                          ).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          '1 USD = ${currency.rate.toStringAsFixed(4)} ${currency.code}',
                          style: AppTextStyles.bodySm(t.txtSecondary),
                        ),
                      ),
                      if (isSelected)
                        Icon(LucideIcons.check, size: 16, color: t.primary)
                      else
                        const SizedBox(width: 16),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
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
