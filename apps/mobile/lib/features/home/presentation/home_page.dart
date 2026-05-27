import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../features/analytics/presentation/home_analytics_view.dart';
import '../../../features/analytics/presentation/home_filter_sheet.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/home_summary.dart';
import '../providers/home_provider.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  bool _showAnalytics = false;

  @override
  Widget build(BuildContext context) {
    final asyncState = ref.watch(homeNotifierProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return AppBackground(
      scrollable: true,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: asyncState.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 120),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => _ErrorView(
              message: e.toString(),
              onRetry: () => ref.read(homeNotifierProvider.notifier).refresh(),
            ),
            data: (state) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                _Header(
                  startDate: state.startDate,
                  onFilterTap: () => _openFilterSheet(context),
                ),
                const SizedBox(height: 16),
                _ViewToggle(
                  showAnalytics: _showAnalytics,
                  onToggle: (v) => setState(() => _showAnalytics = v),
                ),
                const SizedBox(height: 20),
                if (!_showAnalytics) ...[
                  _BalanceCard(summary: state.summary),
                  const SizedBox(height: 14),
                  _BudgetCard(summary: state.summary),
                  const SizedBox(height: 24),
                  _TopCategoriesSection(
                    categories: state.summary?.topCategories ?? [],
                  ),
                  const SizedBox(height: 24),
                  _RecentTransactionsSection(
                    transactions: state.summary?.recentTransactions ?? [],
                  ),
                ] else
                  const HomeAnalyticsView(),
                SizedBox(height: bottomPad + 76 + 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const HomeFilterSheet(),
    );
  }
}

// ── View toggle ───────────────────────────────────────────────────────────────

class _ViewToggle extends StatelessWidget {
  const _ViewToggle({required this.showAnalytics, required this.onToggle});

  final bool showAnalytics;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Container(
      height: 38,
      decoration: BoxDecoration(
        color: t.isDark
            ? Colors.white.withValues(alpha: 0.07)
            : Colors.black.withValues(alpha: 0.06),
        borderRadius: AppRadius.smAll,
      ),
      child: Row(
        children: [
          _Tab(
            label: 'Overview',
            selected: !showAnalytics,
            onTap: () => onToggle(false),
          ),
          _Tab(
            label: 'Analytics',
            selected: showAnalytics,
            onTap: () => onToggle(true),
          ),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: selected
                ? (t.isDark ? const Color(0xFF2A2440) : Colors.white)
                : Colors.transparent,
            borderRadius: AppRadius.smAll,
            boxShadow: selected && !t.isDark ? AppShadows.cardLight : [],
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTextStyles.bodySm(
              selected ? t.txtPrimary : t.txtTertiary,
            ).copyWith(fontWeight: selected ? FontWeight.w600 : FontWeight.w400),
          ),
        ),
      ),
    );
  }
}

// ── Error view ────────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 80),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off_rounded, size: 48, color: t.txtTertiary),
          const SizedBox(height: 12),
          Text(
            'Failed to load data',
            style: AppTextStyles.body(t.txtPrimary)
                .copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            message,
            style: AppTextStyles.bodySm(t.txtTertiary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: 160,
            child: PrimaryButton(label: 'Try again', onPressed: onRetry),
          ),
        ],
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.startDate, required this.onFilterTap});

  final DateTime startDate;
  final VoidCallback onFilterTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final monthLabel = fmt.formatMonthYear(startDate);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('Hello', style: AppTextStyles.body(t.txtSecondary)),
                  const SizedBox(width: 6),
                  Icon(LucideIcons.hand, size: 16, color: t.txtSecondary),
                ],
              ),
              const SizedBox(height: 2),
              Text(monthLabel, style: AppTextStyles.h1(t.txtPrimary)),
            ],
          ),
        ),
        GestureDetector(
          onTap: onFilterTap,
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.black.withValues(alpha: 0.05),
              borderRadius: AppRadius.smAll,
            ),
            child: Icon(LucideIcons.slidersHorizontal,
                size: 18, color: t.txtSecondary),
          ),
        ),
      ],
    );
  }
}

// ── Balance Card ──────────────────────────────────────────────────────────────

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.summary});

  final HomeSummary? summary;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Total Balance',
            textAlign: TextAlign.center,
            style: AppTextStyles.caption(t.txtSecondary)
                .copyWith(fontSize: 12, letterSpacing: 0.5),
          ),
          const SizedBox(height: 6),
          Text(
            summary != null
                ? '${summary!.balance < 0 ? '-' : ''}${fmt.formatCurrency(summary!.balance)}'
                : '—',
            textAlign: TextAlign.center,
            style: AppTextStyles.moneyLg(t.txtPrimary).copyWith(fontSize: 34),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _MiniCard(
                  label: 'INCOME',
                  value: summary != null
                      ? fmt.formatCurrency(summary!.totalIncome)
                      : '—',
                  isIncome: true,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MiniCard(
                  label: 'EXPENSES',
                  value: summary != null
                      ? fmt.formatCurrency(summary!.totalExpenses)
                      : '—',
                  isIncome: false,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniCard extends StatelessWidget {
  const _MiniCard({
    required this.label,
    required this.value,
    required this.isIncome,
  });

  final String label;
  final String value;
  final bool isIncome;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final color = isIncome ? t.success : t.error;
    final bg = isIncome ? t.incomeBg : t.expenseBg;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.smAll),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                isIncome ? '↑' : '↓',
                style: TextStyle(
                    fontSize: 13, color: color, fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: AppTextStyles.caption(color).copyWith(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(value, style: AppTextStyles.moneyMd(color).copyWith(fontSize: 15)),
        ],
      ),
    );
  }
}

// ── Budget Card ───────────────────────────────────────────────────────────────

class _BudgetCard extends StatelessWidget {
  const _BudgetCard({required this.summary});

  final HomeSummary? summary;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final percent = summary != null
        ? (summary!.budgetSpentPercentage / 100).clamp(0.0, 1.0)
        : 0.0;
    final percentStr =
        summary != null ? '${summary!.budgetSpentPercentage.round()}%' : '—';
    final fmt = AppLocaleScope.of(context);
    final spentStr =
        summary != null ? fmt.formatCurrency(summary!.budgetTotalSpent) : '—';

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BUDGET',
                      style: AppTextStyles.caption(t.txtTertiary).copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('Current period', style: AppTextStyles.h3(t.txtPrimary)),
                  ],
                ),
              ),
              Text(
                percentStr,
                style: AppTextStyles.body(t.warning)
                    .copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppProgressBar(percent: percent),
          const SizedBox(height: 10),
          Row(
            children: [
              Text('$spentStr spent',
                  style: AppTextStyles.bodySm(t.txtSecondary)),
              const Spacer(),
              GestureDetector(
                onTap: () => context.go('/budgets'),
                child: Text(
                  'View budget →',
                  style: AppTextStyles.bodySm(t.primary)
                      .copyWith(fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Top Categories ────────────────────────────────────────────────────────────

class _TopCategoriesSection extends StatelessWidget {
  const _TopCategoriesSection({required this.categories});

  final List<TopCategorySummary> categories;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    if (categories.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Top Categories', style: AppTextStyles.h3(t.txtPrimary)),
        const SizedBox(height: 14),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children:
                categories.map((cat) => _CategoryChip(data: cat)).toList(),
          ),
        ),
      ],
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.data});

  final TopCategorySummary data;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: t.isDark
            ? const Color(0xFF1C1830).withValues(alpha: 0.72)
            : Colors.white.withValues(alpha: 0.9),
        borderRadius: AppRadius.lgAll,
        border: Border.all(
          color: t.isDark
              ? Colors.white.withValues(alpha: 0.07)
              : const Color(0xFF7C3AED).withValues(alpha: 0.12),
        ),
        boxShadow: t.isDark ? [] : AppShadows.cardLight,
      ),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: t.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                data.categoryName.isNotEmpty
                    ? data.categoryName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: t.primary,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            data.categoryName,
            style: AppTextStyles.bodySm(t.txtSecondary).copyWith(fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            AppLocaleScope.of(context).formatCurrency(data.totalSpentCents),
            style: AppTextStyles.body(t.txtPrimary).copyWith(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Recent Transactions ───────────────────────────────────────────────────────

class _RecentTransactionsSection extends StatelessWidget {
  const _RecentTransactionsSection({required this.transactions});

  final List<RecentTransactionSummary> transactions;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    if (transactions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Recent Transactions', style: AppTextStyles.h3(t.txtPrimary)),
            const Spacer(),
            GestureDetector(
              onTap: () => context.go('/transactions'),
              child: Text(
                'See all →',
                style: AppTextStyles.bodySm(t.primary)
                    .copyWith(fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ...List.generate(transactions.length, (i) {
          return _TransactionRow(
            data: transactions[i],
            showDivider: i < transactions.length - 1,
          );
        }),
      ],
    );
  }
}

class _TransactionRow extends StatelessWidget {
  const _TransactionRow({required this.data, this.showDivider = true});

  final RecentTransactionSummary data;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final amountColor = data.isExpense ? t.error : t.success;
    final sign = data.isExpense ? '-' : '+';
    final amountStr = '$sign${fmt.formatCurrency(data.valueCents.abs())}';
    final subtitle = '${data.categoryName} · ${data.subCategoryName}';

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: amountColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    data.isExpense
                        ? Icons.arrow_downward_rounded
                        : Icons.arrow_upward_rounded,
                    size: 20,
                    color: amountColor,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data.description,
                      style: AppTextStyles.body(t.txtPrimary).copyWith(
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: AppTextStyles.bodySm(t.txtTertiary)),
                  ],
                ),
              ),
              Text(
                amountStr,
                style: AppTextStyles.body(amountColor).copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            color: t.divider.withValues(alpha: t.isDark ? 0.4 : 0.7),
          ),
      ],
    );
  }
}
