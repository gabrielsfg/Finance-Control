import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/dtos/currency_response_dto.dart';
import '../data/dtos/update_user_preferences_request_dto.dart';
import '../data/dtos/user_preferences_response_dto.dart';
import '../data/user_preferences_repository.dart';

final userPreferencesProvider =
    AsyncNotifierProvider<UserPreferencesNotifier, UserPreferencesResponseDto>(
  UserPreferencesNotifier.new,
);

class UserPreferencesNotifier
    extends AsyncNotifier<UserPreferencesResponseDto> {
  @override
  Future<UserPreferencesResponseDto> build() async {
    return ref.read(userPreferencesRepositoryProvider).getPreferences();
  }

  Future<void> updatePreferences(UpdateUserPreferencesRequestDto dto) async {
    final updated = await ref
        .read(userPreferencesRepositoryProvider)
        .updatePreferences(dto);
    state = AsyncData(updated);
  }
}

final currenciesProvider =
    AsyncNotifierProvider<CurrenciesNotifier, List<CurrencyResponseDto>>(
  CurrenciesNotifier.new,
);

class CurrenciesNotifier extends AsyncNotifier<List<CurrencyResponseDto>> {
  @override
  Future<List<CurrencyResponseDto>> build() async {
    return ref.read(userPreferencesRepositoryProvider).getCurrencies();
  }
}
