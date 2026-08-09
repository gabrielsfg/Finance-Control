import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// True while a modal overlay (bottom sheet, dialog, popup) is on top of the
/// app. The shell watches this to hide its floating action button so the "+"
/// never shows over an open sheet/filter.
final overlaySheetOpenProvider = StateProvider<bool>((ref) => false);

/// Flips [overlaySheetOpenProvider] whenever a bottom sheet / dialog / popup
/// route is pushed or popped — regardless of which page opened it.
class OverlayRouteObserver extends NavigatorObserver {
  OverlayRouteObserver(this._ref);

  final Ref _ref;
  int _count = 0;

  bool _isOverlay(Route<dynamic>? route) =>
      route is ModalBottomSheetRoute || route is PopupRoute;

  void _sync() {
    final open = _count > 0;
    // Defer to avoid mutating a provider during a route/build phase.
    Future.microtask(() {
      final notifier = _ref.read(overlaySheetOpenProvider.notifier);
      if (notifier.state != open) notifier.state = open;
    });
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    if (_isOverlay(route)) {
      _count++;
      _sync();
    }
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    if (_isOverlay(route)) {
      _count = _count > 0 ? _count - 1 : 0;
      _sync();
    }
  }

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) {
    if (_isOverlay(route)) {
      _count = _count > 0 ? _count - 1 : 0;
      _sync();
    }
  }
}
