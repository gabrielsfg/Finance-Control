import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/notification_provider.dart';

/// Header entry point for notifications: the same square icon button the rest
/// of the app uses, with an unread badge on top.
class NotificationBell extends ConsumerWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final unread = ref.watch(unreadNotificationCountProvider).valueOrNull ?? 0;

    return GestureDetector(
      onTap: () => context.push('/notifications'),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 42,
        height: 42,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: t.surface,
                borderRadius: AppRadius.baseAll,
                border: Border.all(color: t.mist),
              ),
              child: Icon(LucideIcons.bell, size: 18, color: t.txtSecondary),
            ),
            if (unread > 0)
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  constraints: const BoxConstraints(minWidth: 18),
                  height: 18,
                  decoration: BoxDecoration(
                    color: t.clay,
                    borderRadius: AppRadius.pillAll,
                    border: Border.all(color: t.bg, width: 2),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    unread > 9 ? '9+' : '$unread',
                    style: const TextStyle(
                      fontSize: 10,
                      height: 1,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
