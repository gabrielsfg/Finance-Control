import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/dtos/update_wishlist_item_request_dto.dart';
import '../data/models/wishlist_item.dart';
import '../data/models/wishlist_item_detail.dart';
import '../providers/wishlist_provider.dart';

class WishlistDetailPage extends ConsumerStatefulWidget {
  const WishlistDetailPage({super.key, required this.itemId});

  final int itemId;

  @override
  ConsumerState<WishlistDetailPage> createState() =>
      _WishlistDetailPageState();
}

class _WishlistDetailPageState extends ConsumerState<WishlistDetailPage> {
  bool _isRecordingPrice = false;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final detailAsync = ref.watch(wishlistDetailProvider(widget.itemId));

    return Scaffold(
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          child: detailAsync.when(
            loading: () => const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            error: (_, _) => Center(
              child: Text(
                'Could not load item.',
                style: AppTextStyles.body(t.error),
              ),
            ),
            data: (item) => _DetailContent(
              item: item,
              isRecordingPrice: _isRecordingPrice,
              onRecordPrice: () => _showRecordPriceDialog(context, item),
              onPurchase: () => _confirmPurchase(context, item),
              onCancel: () => _confirmCancel(context, item),
            ),
          ),
        ),
      ),
    );
  }

  void _showRecordPriceDialog(BuildContext context, WishlistItemDetail item) {
    final t = AppThemeTokens.of(context);
    final controller = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: t.isDark ? const Color(0xFF1C1830) : Colors.white,
        title: Text('Record price', style: AppTextStyles.h3(t.txtPrimary)),
        content: AppInputField(
          placeholder: '0,00',
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [const CentsInputFormatter()],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel', style: AppTextStyles.body(t.txtSecondary)),
          ),
          TextButton(
            onPressed: () async {
              final cents = CentsInputFormatter.parseCents(controller.text);
              if (cents <= 0) return;
              Navigator.of(context).pop();
              setState(() => _isRecordingPrice = true);
              try {
                await ref
                    .read(wishlistDetailProvider(widget.itemId).notifier)
                    .recordPrice(cents);
              } finally {
                if (mounted) setState(() => _isRecordingPrice = false);
              }
            },
            child: Text('Save', style: AppTextStyles.body(t.primary)),
          ),
        ],
      ),
    );
  }

  void _confirmPurchase(BuildContext context, WishlistItemDetail item) {
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
              context.pop();
            },
            child: Text('Confirm',
                style: AppTextStyles.body(const Color(0xFF22C55E))),
          ),
        ],
      ),
    );
  }

  void _confirmCancel(BuildContext context, WishlistItemDetail item) {
    final t = AppThemeTokens.of(context);
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: t.isDark ? const Color(0xFF1C1830) : Colors.white,
        title: Text('Cancel item?', style: AppTextStyles.h3(t.txtPrimary)),
        content: Text(
          'This will mark "${item.name}" as cancelled.',
          style: AppTextStyles.body(t.txtSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Back', style: AppTextStyles.body(t.txtSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(wishlistProvider.notifier).updateItem(
                    item.id,
                    const UpdateWishlistItemRequestDto(status: 'Cancelled'),
                  );
              context.pop();
            },
            child: Text('Cancel item', style: AppTextStyles.body(t.error)),
          ),
        ],
      ),
    );
  }
}

// ── Helper ─────────────────────────────────────────────────────────────────

WishlistItem _wishlistItemFromDetail(WishlistItemDetail d) => WishlistItem(
      id: d.id,
      name: d.name,
      description: d.description,
      targetPriceCents: d.targetPriceCents,
      priority: d.priority,
      status: d.status,
      url: d.url,
      imageUrl: d.imageUrl,
      latestPriceCents: d.latestPriceCents,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    );

// ── Detail content ─────────────────────────────────────────────────────────

class _DetailContent extends StatelessWidget {
  const _DetailContent({
    required this.item,
    required this.isRecordingPrice,
    required this.onRecordPrice,
    required this.onPurchase,
    required this.onCancel,
  });

  final WishlistItemDetail item;
  final bool isRecordingPrice;
  final VoidCallback onRecordPrice;
  final VoidCallback onPurchase;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: AppSpacing.screenPadding,
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              const SizedBox(height: 8),

              // ── Header ────────────────────────────────────────────────
              Row(
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
                  const Spacer(),
                  if (item.isPending)
                    GestureDetector(
                      onTap: () => context.push(
                        '/wishlist/${item.id}/edit',
                        extra: _wishlistItemFromDetail(item),
                      ),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.primary.withValues(alpha: 0.12),
                        ),
                        child: Icon(LucideIcons.pencil,
                            size: 16, color: t.primary),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Name + badges ─────────────────────────────────────────
              Text(item.name, style: AppTextStyles.h1(t.txtPrimary)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _Badge(
                    label: _priorityLabel(item.priority),
                    color: _priorityColor(item.priority),
                  ),
                  const SizedBox(width: 8),
                  _Badge(
                    label: _statusLabel(item.status),
                    color: _statusColor(item.status, t),
                  ),
                ],
              ),

              if (item.description != null) ...[
                const SizedBox(height: 16),
                Text(item.description!,
                    style: AppTextStyles.body(t.txtSecondary)),
              ],

              const SizedBox(height: 24),

              // ── Price summary ─────────────────────────────────────────
              _PriceRow(
                label: 'Current price',
                value: item.latestPriceCents != null
                    ? fmt.formatCurrency(item.latestPriceCents!)
                    : '—',
                valueColor: t.txtPrimary,
              ),
              const SizedBox(height: 8),
              _PriceRow(
                label: 'Target price',
                value: item.targetPriceCents != null
                    ? fmt.formatCurrency(item.targetPriceCents!)
                    : '—',
                valueColor: t.txtSecondary,
              ),

              const SizedBox(height: 28),

              // ── Actions ───────────────────────────────────────────────
              if (item.isPending) ...[
                isRecordingPrice
                    ? const Center(
                        child: SizedBox(
                          height: 48,
                          child: Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      )
                    : PrimaryButton(
                        label: 'Record current price',
                        onPressed: onRecordPrice,
                      ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _OutlineButton(
                        label: 'Mark as purchased',
                        color: const Color(0xFF22C55E),
                        onTap: onPurchase,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _OutlineButton(
                        label: 'Cancel item',
                        color: t.error,
                        onTap: onCancel,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
              ],

              // ── Price history ─────────────────────────────────────────
              if (item.priceHistory.isNotEmpty) ...[
                Text('Price history', style: AppTextStyles.h3(t.txtPrimary)),
                const SizedBox(height: 12),
                ...item.priceHistory.reversed.map(
                  (p) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            fmt.formatDate(p.recordedAt.toLocal()),
                            style: AppTextStyles.bodySm(t.txtSecondary),
                          ),
                        ),
                        Text(
                          fmt.formatCurrency(p.priceCents),
                          style: AppTextStyles.body(t.txtPrimary)
                              .copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 32),
            ]),
          ),
        ),
      ],
    );
  }

  String _priorityLabel(WishlistPriority p) => switch (p) {
        WishlistPriority.high => 'High priority',
        WishlistPriority.medium => 'Medium priority',
        WishlistPriority.low => 'Low priority',
      };

  Color _priorityColor(WishlistPriority p) => switch (p) {
        WishlistPriority.high => const Color(0xFFEF4444),
        WishlistPriority.medium => const Color(0xFFF59E0B),
        WishlistPriority.low => const Color(0xFF22C55E),
      };

  String _statusLabel(WishlistStatus s) => switch (s) {
        WishlistStatus.purchased => 'Purchased',
        WishlistStatus.cancelled => 'Cancelled',
        WishlistStatus.pending => 'Pending',
      };

  Color _statusColor(WishlistStatus s, AppThemeTokens t) => switch (s) {
        WishlistStatus.purchased => const Color(0xFF22C55E),
        WishlistStatus.cancelled => t.txtTertiary,
        WishlistStatus.pending => t.primary,
      };
}

// ── Small widgets ──────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: AppTextStyles.caption(color)
            .copyWith(fontWeight: FontWeight.w600, fontSize: 11),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        Expanded(child: Text(label, style: AppTextStyles.body(t.txtSecondary))),
        Text(
          value,
          style: AppTextStyles.body(valueColor)
              .copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _OutlineButton extends StatelessWidget {
  const _OutlineButton({
    required this.label,
    required this.color,
    required this.onTap,
  });

  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: color.withValues(alpha: 0.6)),
          color: color.withValues(alpha: 0.08),
        ),
        child: Center(
          child: Text(
            label,
            style: AppTextStyles.body(color)
                .copyWith(fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ),
      ),
    );
  }
}
