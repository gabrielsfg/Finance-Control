import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../transactions/data/models/transaction_item.dart';
import '../data/models/category_preview.dart';

// ── Mock data (TODO: replace with Riverpod providers) ─────────────────────

const _kUserName = 'Gabriel';
const _kUserInitials = 'GF';

const _kBalance = 384752;  // R$ 3.847,52
const _kIncome  = 520000;  // R$ 5.200,00
const _kExpense = 135248;  // R$ 1.352,48

const _kBudgetName    = 'Fixed Costs';
const _kBudgetPercent = 0.85;
const _kBudgetSpent   = 161500; // R$ 1.615,00

const _kCategories = [
  CategoryPreview('Housing',     Icons.home_outlined,             180000, Color(0xFF8B5CF6)),
  CategoryPreview('Food',        Icons.restaurant_outlined,        48720, Color(0xFFF59E0B)),
  CategoryPreview('Transport',   Icons.directions_car_outlined,    21000, Color(0xFF06B6D4)),
  CategoryPreview('Health',      Icons.favorite_outline,           15600, Color(0xFFEF4444)),
];

final _kTransactions = [
  TransactionItem(
    name: 'Rent',
    subtitle: 'Housing · Rent',
    amountCents: -180000,
    icon: Icons.home_outlined,
    color: const Color(0xFF8B5CF6),
    date: DateTime(2026, 2, 15),
    category: 'Housing',
    subcategory: 'Rent',
    account: 'Nubank',
    type: 'Expense',
    recurrence: 'Monthly',
  ),
  TransactionItem(
    name: 'iFood',
    subtitle: 'Food · Delivery',
    amountCents: -6790,
    icon: Icons.restaurant_outlined,
    color: const Color(0xFFF59E0B),
    date: DateTime(2026, 2, 18),
    category: 'Food',
    subcategory: 'Delivery',
    account: 'Nubank',
    type: 'Expense',
  ),
  TransactionItem(
    name: 'Uber',
    subtitle: 'Transport · Ride',
    amountCents: -3240,
    icon: Icons.directions_car_outlined,
    color: const Color(0xFF06B6D4),
    date: DateTime(2026, 2, 14),
    category: 'Transport',
    subcategory: 'Ride',
    account: 'Nubank',
    type: 'Expense',
  ),
  TransactionItem(
    name: 'Salary',
    subtitle: 'Income · Work',
    amountCents: 520000,
    icon: Icons.work_outline,
    color: const Color(0xFF22C55E),
    date: DateTime(2026, 2, 18),
    category: 'Income',
    subcategory: 'Salary',
    account: 'Nubank',
    type: 'Income',
    recurrence: 'Monthly',
  ),
  TransactionItem(
    name: 'Pharmacy',
    subtitle: 'Health · Medicine',
    amountCents: -4580,
    icon: Icons.local_pharmacy_outlined,
    color: const Color(0xFFEF4444),
    date: DateTime(2026, 2, 14),
    category: 'Health',
    subcategory: 'Medicine',
    account: 'Nubank',
    type: 'Expense',
  ),
];

// ── Page ───────────────────────────────────────────────────────────────────

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return AppBackground(
      scrollable: true,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: AppSpacing.screenPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              const _Header(),
              const SizedBox(height: 20),
              const _BalanceCard(),
              const SizedBox(height: 14),
              const _BudgetCard(),
              const SizedBox(height: 24),
              const _TopCategoriesSection(),
              const SizedBox(height: 24),
              const _RecentTransactionsSection(),
              // Space for nav bar + FAB + bottom safe area
              SizedBox(height: bottomPad + 76 + 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final now = DateTime.now();
    final monthLabel = '${monthName(now.month)} ${now.year}';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hello, $_kUserName 👋',
                style: AppTextStyles.body(t.txtSecondary),
              ),
              const SizedBox(height: 2),
              Text(monthLabel, style: AppTextStyles.h1(t.txtPrimary)),
            ],
          ),
        ),
        const ThemeToggleButton(),
        const SizedBox(width: 8),
        const AppAvatar(initials: _kUserInitials, size: 44),
      ],
    );
  }
}

// ── Balance Card ───────────────────────────────────────────────────────────

class _BalanceCard extends StatelessWidget {
  const _BalanceCard();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

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
            formatCurrency(_kBalance),
            textAlign: TextAlign.center,
            style: AppTextStyles.moneyLg(t.txtPrimary).copyWith(fontSize: 34),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _MiniCard(
                  label: 'INCOME',
                  value: formatCurrency(_kIncome),
                  isIncome: true,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MiniCard(
                  label: 'EXPENSES',
                  value: formatCurrency(_kExpense),
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
  final String label;
  final String value;
  final bool isIncome;

  const _MiniCard({
    required this.label,
    required this.value,
    required this.isIncome,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final color = isIncome ? t.success : t.error;
    final bg    = isIncome ? t.incomeBg : t.expenseBg;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.smAll),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isIncome ? Icons.trending_up : Icons.trending_down,
                size: 13,
                color: color,
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
          Text(
            value,
            style: AppTextStyles.moneyMd(color).copyWith(fontSize: 15),
          ),
        ],
      ),
    );
  }
}

// ── Budget Card ────────────────────────────────────────────────────────────

class _BudgetCard extends StatelessWidget {
  const _BudgetCard();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final percentStr = '${(_kBudgetPercent * 100).round()}%';

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
                      'ACTIVE BUDGET',
                      style: AppTextStyles.caption(t.txtTertiary).copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(_kBudgetName, style: AppTextStyles.h3(t.txtPrimary)),
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
          const AppProgressBar(percent: _kBudgetPercent),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                '${formatCurrency(_kBudgetSpent)} spent',
                style: AppTextStyles.bodySm(t.txtSecondary),
              ),
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

// ── Top Categories ─────────────────────────────────────────────────────────

class _TopCategoriesSection extends StatelessWidget {
  const _TopCategoriesSection();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Top Categories', style: AppTextStyles.h3(t.txtPrimary)),
        const SizedBox(height: 14),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children: _kCategories
                .map((cat) => _CategoryChip(data: cat))
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final CategoryPreview data;
  const _CategoryChip({required this.data});

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
              color: data.color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(data.icon, color: data.color, size: 22),
          ),
          const SizedBox(height: 8),
          Text(
            data.name,
            style: AppTextStyles.bodySm(t.txtSecondary).copyWith(fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            formatCurrency(data.amountCents),
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

// ── Recent Transactions ────────────────────────────────────────────────────

class _RecentTransactionsSection extends StatelessWidget {
  const _RecentTransactionsSection();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final items = _kTransactions.take(5).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Recent Transactions',
              style: AppTextStyles.h3(t.txtPrimary),
            ),
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
        ...List.generate(items.length, (i) {
          return _TransactionItem(
            data: items[i],
            showDivider: i < items.length - 1,
          );
        }),
      ],
    );
  }
}

class _TransactionItem extends StatelessWidget {
  final TransactionItem data;
  final bool showDivider;

  const _TransactionItem({required this.data, this.showDivider = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isExpense   = data.amountCents < 0;
    final amountColor = isExpense ? t.error : t.success;
    final sign        = isExpense ? '-' : '+';
    final amountStr   = '$sign${formatCurrency(data.amountCents.abs())}';

    return Column(
      children: [
        GestureDetector(
          onTap: () => context.push('/transactions/detail', extra: data),
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: data.color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(data.icon, color: data.color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data.name,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        data.subtitle,
                        style: AppTextStyles.bodySm(t.txtTertiary),
                      ),
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
