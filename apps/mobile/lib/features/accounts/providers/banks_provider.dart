import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../profile/data/user_preferences_repository.dart';
import '../../profile/providers/user_preferences_provider.dart';

/// Loads banks for the user's current country preference.
/// Falls back to BR if country is null.
final banksProvider = AsyncNotifierProvider<BanksNotifier, List<String>>(
  BanksNotifier.new,
);

class BanksNotifier extends AsyncNotifier<List<String>> {
  @override
  Future<List<String>> build() async {
    final prefs = await ref.watch(userPreferencesProvider.future);
    final country = prefs.country?.toUpperCase() ?? 'BR';
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
