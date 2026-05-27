import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/wishlist_item.dart';
import '../providers/wishlist_provider.dart';

class WishlistPage extends ConsumerWidget {
  const WishlistPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final wishlistAsync = ref.watch(wishlistProvider);

    return Scaffold(
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.07)
                              : Colors.black.withValues(alpha: 0.05),
                        ),
                        child: Icon(
                          Icons.arrow_back_ios_new_rounded,
                          size: 16,
                          color: t.txtPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        'Wishlist',
                        style: AppTextStyles.h1(t.txtPrimary),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.push('/wishlist/create'),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.primary.withValues(alpha: 0.12),
                        ),
                        child: Icon(
                          Icons.add_rounded,
                          size: 22,
                          color: t.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: wishlistAsync.when(
                  loading: () => const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  error: (e, _) => Center(
                    child: Text(
                      'Could not load wishlist.',
                      style: AppTextStyles.body(t.error),
                    ),
                  ),
                  data: (items) => items.isEmpty
                      ? _EmptyState(t: t)
                      : ListView.separated(
                          padding: AppSpacing.screenPadding.copyWith(top: 0),
                          itemCount: items.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, i) => _WishlistCard(item: items[i]),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Empty state ────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.t});
  final AppThemeTokens t;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.gift, size: 48, color: t.txtTertiary),
          const SizedBox(height: 16),
          Text('Your wishlist is empty', style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 6),
          Text(
            'Add items you want to track and save for',
            style: AppTextStyles.body(t.txtSecondary),
          ),
        ],
      ),
    );
  }
}

// ── Wishlist card ──────────────────────────────────────────────────────────

class _WishlistCard extends ConsumerWidget {
  const _WishlistCard({required this.item});
  final WishlistItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);

    final priorityColor = switch (item.priority) {
      WishlistPriority.high => const Color(0xFFEF4444),
      WishlistPriority.medium => const Color(0xFFF59E0B),
      WishlistPriority.low => const Color(0xFF22C55E),
    };

    final priorityLabel = switch (item.priority) {
      WishlistPriority.high => 'High',
      WishlistPriority.medium => 'Medium',
      WishlistPriority.low => 'Low',
    };

    final statusColor = switch (item.status) {
      WishlistStatus.purchased => const Color(0xFF22C55E),
      WishlistStatus.cancelled => t.txtTertiary,
      WishlistStatus.pending => t.primary,
    };

    final statusLabel = switch (item.status) {
      WishlistStatus.purchased => 'Purchased',
      WishlistStatus.cancelled => 'Cancelled',
      WishlistStatus.pending => 'Pending',
    };

    return GestureDetector(
      onTap: () => context.push('/wishlist/${item.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: t.isDark
              ? const Color(0xFF1C1830).withValues(alpha: 0.72)
              : Colors.white.withValues(alpha: 0.9),
          borderRadius: AppRadius.xlAll,
          border: Border.all(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.07)
                : const Color(0xFF7C3AED).withValues(alpha: 0.10),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: priorityColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          priorityLabel,
                          style: AppTextStyles.caption(priorityColor).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          statusLabel,
                          style: AppTextStyles.caption(statusColor).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item.name,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (item.latestPriceCents != null ||
                      item.targetPriceCents != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (item.latestPriceCents != null)
                          Text(
                            fmt.formatCurrency(item.latestPriceCents!),
                            style: AppTextStyles.bodySm(t.txtPrimary).copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        if (item.latestPriceCents != null &&
                            item.targetPriceCents != null)
                          Text(
                            '  ·  Target: ',
                            style: AppTextStyles.bodySm(t.txtTertiary),
                          ),
                        if (item.targetPriceCents != null)
                          Text(
                            fmt.formatCurrency(item.targetPriceCents!),
                            style: AppTextStyles.bodySm(t.txtSecondary),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            if (item.isPending) ...[
              _CardAction(
                icon: LucideIcons.shoppingCart,
                color: const Color(0xFF22C55E),
                onTap: () => _confirmPurchase(context, ref),
              ),
              const SizedBox(width: 8),
            ],
            _CardAction(
              icon: LucideIcons.pencil,
              color: t.primary,
              onTap: () => context.push('/wishlist/${item.id}/edit',
                  extra: item),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmPurchase(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: t.isDark ? const Color(0xFF1C1830) : Colors.white,
        title: Text('Mark as purchased?',
            style: AppTextStyles.h3(t.txtPrimary)),
        content: Text(
          'This will mark "${item.name}" as purchased.',
          style: AppTextStyles.body(t.txtSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel', style: AppTextStyles.body(t.txtSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(wishlistProvider.notifier).purchase(item.id);
            },
            child: Text('Confirm',
                style: AppTextStyles.body(const Color(0xFF22C55E))),
          ),
        ],
      ),
    );
  }
}

class _CardAction extends StatelessWidget {
  const _CardAction({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color.withValues(alpha: 0.12),
        ),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}
