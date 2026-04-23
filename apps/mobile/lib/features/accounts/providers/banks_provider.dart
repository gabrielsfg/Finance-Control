import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/app_locale.dart';
import '../../profile/data/user_preferences_repository.dart';

/// Loads banks for the user's current country, derived from [appLocaleProvider].
/// Falls back to 'BR' if country is empty.
final banksProvider = AsyncNotifierProvider<BanksNotifier, List<String>>(
  BanksNotifier.new,
);

class BanksNotifier extends AsyncNotifier<List<String>> {
  @override
  Future<List<String>> build() async {
    final locale = ref.watch(appLocaleProvider);
    final country = locale.country.isNotEmpty ? locale.country : 'BR';
    return _fetch(country);
  }

  Future<List<String>> _fetch(String country) async {
    final dtos = await ref
        .read(userPreferencesRepositoryProvider)
        .getBanks(country);
    return dtos.map((e) => e.name).toList();
  }

  Future<void> refreshForCountry(String country) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch(country));
  }
}
