import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/notification_visuals.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/notification_models.dart';
import '../providers/notification_provider.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    // The list is cached between visits while the badge keeps polling, so the
    // two can drift apart. Re-fetch only when they actually disagree — on the
    // first visit the provider is loading anyway and nothing extra is asked.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final cached = ref.read(notificationsProvider).valueOrNull;
      if (cached == null) return;

      final badge = ref.read(unreadNotificationCountProvider).valueOrNull ?? 0;
      if (cached.where((n) => !n.isRead).length != badge) {
        ref.read(notificationsProvider.notifier).refresh();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(notificationsProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                PageHeader(
                  eyebrow: 'ATIVIDADE',
                  title: 'Notificações',
                  showBack: true,
                  onBack: () => context.pop(),
                  trailing: HeaderActionButton(
                    icon: LucideIcons.settings,
                    onTap: () => context.push('/notifications/preferences'),
                  ),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: async.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(
                      child: _ErrorState(
                        onRetry: () =>
                            ref.read(notificationsProvider.notifier).refresh(),
                      ),
                    ),
                    data: (items) {
                      if (items.isEmpty) {
                        return const Center(child: _EmptyState());
                      }

                      final unread = items.where((n) => !n.isRead).length;

                      return RefreshIndicator(
                        onRefresh: () =>
                            ref.read(notificationsProvider.notifier).refresh(),
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: EdgeInsets.only(bottom: bottomPad + 96),
                          children: [
                            if (unread > 0) ...[
                              Align(
                                alignment: Alignment.centerRight,
                                child: _MarkAllButton(
                                  onTap: () => ref
                                      .read(notificationsProvider.notifier)
                                      .markAllAsRead(),
                                ),
                              ),
                              const SizedBox(height: 12),
                            ],
                            for (final n in items)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _NotificationCard(
                                  notification: n,
                                  onTap: () => _open(context, ref, n),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Reading and navigating are independent: an item with no destination (or one
  /// this app does not have a screen for) still gets marked as read.
  void _open(BuildContext context, WidgetRef ref, AppNotification n) {
    if (!n.isRead) {
      ref.read(notificationsProvider.notifier).markAsRead(n.id);
    }

    final route = n.actionUrl;
    if (route == null) return;

    if (_tabRoutes.contains(route)) {
      // Bottom-bar destinations switch tab instead of stacking on top of it.
      context.go(route);
    } else if (_pushRoutes.contains(route)) {
      context.push(route);
    }
  }
}

/// Destinations the API can point a notification at. Anything outside these two
/// sets is ignored rather than guessed at — the web client has routes this app
/// does not.
const _tabRoutes = {'/', '/transactions', '/budgets', '/accounts'};
const _pushRoutes = {'/goals', '/recurring', '/investments', '/analytics'};

// ── Card ───────────────────────────────────────────────────────────────────

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final visual = notificationVisual(t, notification.type);
    final isUnread = !notification.isRead;

    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      // Unread items sit on the raised surface so the list reads at a glance.
      color: isUnread ? t.surfaceEl : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: visual.color.withValues(alpha: t.isDark ? 0.16 : 0.1),
              borderRadius: AppRadius.smAll,
            ),
            child: Icon(visual.icon, size: 18, color: visual.color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight:
                              isUnread ? FontWeight.w700 : FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (isUnread) ...[
                      const SizedBox(width: 8),
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: t.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  notification.body,
                  style: AppTextStyles.bodySm(t.txtSecondary),
                ),
                const SizedBox(height: 6),
                Text(
                  relativeTimeLabel(notification.createdAt),
                  style: AppTextStyles.caption(t.txtTertiary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Mark all ───────────────────────────────────────────────────────────────

class _MarkAllButton extends StatelessWidget {
  const _MarkAllButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.checkCheck, size: 15, color: t.accent),
          const SizedBox(width: 6),
          Text(
            'Marcar todas como lidas',
            style: AppTextStyles.bodySm(t.accent)
                .copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

// ── States ─────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.bell, size: 44, color: t.txtTertiary),
        const SizedBox(height: 14),
        Text('Nenhuma notificação', style: AppTextStyles.h3(t.txtPrimary)),
        const SizedBox(height: 6),
        Text('Você está em dia', style: AppTextStyles.bodySm(t.txtTertiary)),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.wifiOff, size: 44, color: t.txtTertiary),
        const SizedBox(height: 14),
        Text(
          'Não foi possível carregar',
          style: AppTextStyles.h3(t.txtPrimary),
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: 160,
          child: PrimaryButton(label: 'Tentar de novo', onPressed: onRetry),
        ),
      ],
    );
  }
}
