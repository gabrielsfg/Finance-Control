import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/market_models.dart';
import '../data/market_repository.dart';

/// The market dashboard (macro indicators + rankings).
final marketDashboardProvider =
    AsyncNotifierProvider<MarketDashboardNotifier, MarketDashboard>(
  MarketDashboardNotifier.new,
);

class MarketDashboardNotifier extends AsyncNotifier<MarketDashboard> {
  @override
  Future<MarketDashboard> build() async {
    return ref.read(marketRepositoryProvider).getDashboard();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(marketRepositoryProvider).getDashboard(),
    );
  }
}

/// Detail for a single asset by ticker.
final marketAssetProvider =
    FutureProvider.family<MarketAssetDetail, String>((ref, ticker) {
  return ref.read(marketRepositoryProvider).getAsset(ticker);
});
