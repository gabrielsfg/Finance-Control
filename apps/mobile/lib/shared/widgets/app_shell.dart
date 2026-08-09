import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/overlay_provider.dart';
import 'app_widgets.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _indexFromLocation(location);
    final overlayOpen = ref.watch(overlaySheetOpenProvider);
    final fabRoute = overlayOpen ? null : _fabRouteFor(location);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness:
            Theme.of(context).brightness == Brightness.dark
                ? Brightness.light
                : Brightness.dark,
      ),
      child: Scaffold(
        extendBody: true,
        backgroundColor: Colors.transparent,
        body: child,
        floatingActionButton: fabRoute == null
            ? null
            : AppFAB(onTap: () => context.push(fabRoute)),
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        bottomNavigationBar: AppNavBar(
          activeIndex: currentIndex,
          onTap: (index) => _onTap(context, index),
        ),
      ),
    );
  }

  int _indexFromLocation(String location) {
    if (location.startsWith('/transactions')) return 1;
    if (location.startsWith('/budgets')) return 2;
    if (location.startsWith('/accounts')) return 3;
    // Menu tab also owns the pages reached from it (profile, preferences).
    if (location.startsWith('/menu') || location.startsWith('/profile')) {
      return 4;
    }
    return 0;
  }

  /// The primary "+" action for each tab: it creates the item that belongs to
  /// the current page. Returns null on pages that have nothing to add.
  String? _fabRouteFor(String location) {
    if (location.startsWith('/accounts')) return '/accounts/create';
    if (location.startsWith('/budgets')) return '/budgets/create/step1';
    if (location.startsWith('/menu') || location.startsWith('/profile')) {
      return null;
    }
    // Home and transactions both add a transaction.
    return '/transactions/add';
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/');
      case 1:
        context.go('/transactions');
      case 2:
        context.go('/budgets');
      case 3:
        context.go('/accounts');
      case 4:
        context.go('/menu');
    }
  }
}
