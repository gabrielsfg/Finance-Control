import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/notification_models.dart';
import '../data/notification_repository.dart';

// ── List ───────────────────────────────────────────────────────────────────

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() async {
    return ref.read(notificationRepositoryProvider).getAll();
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(
      () => ref.read(notificationRepositoryProvider).getAll(),
    );
    _syncBadge();
  }

  Future<void> markAsRead(int id) async {
    final list = await ref.read(notificationRepositoryProvider).markAsRead(id);
    state = AsyncData(list);
    _syncBadge();
  }

  Future<void> markAllAsRead() async {
    final list = await ref.read(notificationRepositoryProvider).markAllAsRead();
    state = AsyncData(list);
    _syncBadge();
  }

  /// The mark endpoints answer with the whole list, so the badge can be derived
  /// locally instead of costing another round trip.
  void _syncBadge() {
    final list = state.valueOrNull;
    if (list == null) return;
    ref
        .read(unreadNotificationCountProvider.notifier)
        .setCount(list.where((n) => !n.isRead).length);
  }
}

// ── Unread badge ───────────────────────────────────────────────────────────

/// How often the badge re-checks the server while the app is open. Matches the
/// web client, where the same count drives the bell.
const _pollInterval = Duration(minutes: 1);

final unreadNotificationCountProvider =
    AsyncNotifierProvider<UnreadNotificationCountNotifier, int>(
  UnreadNotificationCountNotifier.new,
);

class UnreadNotificationCountNotifier extends AsyncNotifier<int> {
  Timer? _timer;

  @override
  Future<int> build() async {
    // Rebuilt on login and logout: polling an endpoint without a session would
    // only produce 401s and tear the session down again.
    final isAuthenticated =
        ref.watch(authNotifierProvider).valueOrNull?.isAuthenticated ?? false;

    _timer?.cancel();
    if (!isAuthenticated) return 0;

    _timer = Timer.periodic(_pollInterval, (_) => _poll());
    ref.onDispose(() => _timer?.cancel());

    return ref.read(notificationRepositoryProvider).getUnreadCount();
  }

  Future<void> _poll() async {
    try {
      state = AsyncData(
        await ref.read(notificationRepositoryProvider).getUnreadCount(),
      );
    } catch (_) {
      // A failed poll keeps the last known count — a badge that blinks off on
      // a dropped connection is worse than one that is a minute stale.
    }
  }

  /// Called by the list notifier after a read/read-all so the badge and the
  /// screen never disagree.
  void setCount(int value) => state = AsyncData(value);

  Future<void> refresh() => _poll();
}

// ── Preferences ────────────────────────────────────────────────────────────

final notificationPreferencesProvider = AsyncNotifierProvider<
    NotificationPreferencesNotifier, NotificationPreferences>(
  NotificationPreferencesNotifier.new,
);

class NotificationPreferencesNotifier
    extends AsyncNotifier<NotificationPreferences> {
  @override
  Future<NotificationPreferences> build() async {
    return ref.read(notificationRepositoryProvider).getPreferences();
  }

  /// Applies the new value optimistically and rolls back if the server refuses,
  /// so a toggle never sits in a state the API did not accept.
  Future<void> save(NotificationPreferences preferences) async {
    final previous = state.valueOrNull;
    state = AsyncData(preferences);
    try {
      final saved = await ref
          .read(notificationRepositoryProvider)
          .updatePreferences(preferences);
      state = AsyncData(saved);
    } catch (e) {
      if (previous != null) state = AsyncData(previous);
      rethrow;
    }
  }
}
