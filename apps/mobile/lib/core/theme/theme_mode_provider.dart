import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kThemeModeKey = 'theme_mode';
const _kTimezoneKey = 'timezone';
const _kFirstDayOfWeekKey = 'first_day_of_week';

const _storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

// ── Local Settings (theme + timezone + first day of week) ─────────────────

class LocalSettings {
  const LocalSettings({
    required this.themeMode,
    required this.timezone,
    required this.firstDayOfWeek,
  });

  final ThemeMode themeMode;

  /// IANA timezone string, e.g. "America/Sao_Paulo". Defaults to "America/Sao_Paulo".
  final String timezone;

  /// 0 = Sunday, 1 = Monday, …, 6 = Saturday. Defaults to 0.
  final int firstDayOfWeek;

  LocalSettings copyWith({
    ThemeMode? themeMode,
    String? timezone,
    int? firstDayOfWeek,
  }) =>
      LocalSettings(
        themeMode: themeMode ?? this.themeMode,
        timezone: timezone ?? this.timezone,
        firstDayOfWeek: firstDayOfWeek ?? this.firstDayOfWeek,
      );
}

class LocalSettingsNotifier extends AsyncNotifier<LocalSettings> {
  @override
  Future<LocalSettings> build() async {
    final results = await Future.wait([
      _storage.read(key: _kThemeModeKey),
      _storage.read(key: _kTimezoneKey),
      _storage.read(key: _kFirstDayOfWeekKey),
    ]);
    return LocalSettings(
      themeMode: _parseThemeMode(results[0]),
      timezone: results[1] ?? 'America/Sao_Paulo',
      firstDayOfWeek: int.tryParse(results[2] ?? '') ?? 0,
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    await _storage.write(key: _kThemeModeKey, value: mode.name);
    state = AsyncData(state.requireValue.copyWith(themeMode: mode));
  }

  Future<void> setTimezone(String tz) async {
    await _storage.write(key: _kTimezoneKey, value: tz);
    state = AsyncData(state.requireValue.copyWith(timezone: tz));
  }

  Future<void> setFirstDayOfWeek(int day) async {
    await _storage.write(key: _kFirstDayOfWeekKey, value: day.toString());
    state = AsyncData(state.requireValue.copyWith(firstDayOfWeek: day));
  }
}

final localSettingsProvider =
    AsyncNotifierProvider<LocalSettingsNotifier, LocalSettings>(
  LocalSettingsNotifier.new,
);

/// Convenience selector — only ThemeMode, avoids unnecessary rebuilds.
final themeModeProvider = Provider<ThemeMode>((ref) {
  return ref.watch(localSettingsProvider).valueOrNull?.themeMode ??
      ThemeMode.system;
});

ThemeMode _parseThemeMode(String? raw) {
  switch (raw) {
    case 'light':
      return ThemeMode.light;
    case 'dark':
      return ThemeMode.dark;
    default:
      return ThemeMode.system;
  }
}
