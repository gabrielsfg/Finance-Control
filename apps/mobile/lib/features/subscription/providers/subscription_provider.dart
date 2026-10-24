import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/models/subscription_state.dart';
import '../data/subscription_repository.dart';

/// The signed-in user's subscription. Rebuilt on login/logout (so one account's state
/// never shows for the next), and refreshed when the API answers 403
/// SUBSCRIPTION_REQUIRED (see ApiClient) or the user taps "Já assinei".
final FutureProvider<SubscriptionState> subscriptionProvider = FutureProvider<SubscriptionState>((ref) {
  ref.watch(authNotifierProvider.select((auth) => auth.valueOrNull?.accessToken));
  return ref.read(subscriptionRepositoryProvider).get();
});
