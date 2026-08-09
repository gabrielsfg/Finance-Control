import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/investment_models.dart';
import '../data/investment_repository.dart';

final portfolioProvider =
    AsyncNotifierProvider<PortfolioNotifier, InvestmentPortfolio>(
  PortfolioNotifier.new,
);

class PortfolioNotifier extends AsyncNotifier<InvestmentPortfolio> {
  @override
  Future<InvestmentPortfolio> build() async {
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated) return InvestmentPortfolio.empty;
    return ref.read(investmentRepositoryProvider).getPortfolio();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(investmentRepositoryProvider).getPortfolio(),
    );
  }

  /// Registers a buy/sell and refreshes state with the returned portfolio.
  Future<void> registerTransaction(
    CreateInvestmentTransactionRequest request,
  ) async {
    final updated = await ref
        .read(investmentRepositoryProvider)
        .registerTransaction(request);
    state = AsyncData(updated);
  }
}
