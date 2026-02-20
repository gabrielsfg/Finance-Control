import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/transaction_item.dart';

// ── Mock data (TODO: replace with Riverpod providers) ─────────────────────

const _kIncome  = 520000; // R$ 5.200,00
const _kExpense = 135248; // R$ 1.352,48
const _kBalance = 384752; // R$ 3.847,52

final _kGroups = [
  TransactionGroup(
    date: DateTime(2026, 2, 19),
    items: [
      TransactionItem(
        name: 'Breakfast',
        subtitle: 'Food · Café',
        amountCents: -1200,
        icon: Icons.coffee_outlined,
        color: const Color(0xFFF59E0B),
        date: DateTime(2026, 2, 19),
        category: 'Food',
        subcategory: 'Café',
        account: 'Nubank',
        type: 'Expense',
      ),
      TransactionItem(
        name: 'Uber to work',
        subtitle: 'Transport · Ride',
        amountCents: -1890,
        icon: Icons.directions_car_outlined,
        color: const Color(0xFF06B6D4),
        date: DateTime(2026, 2, 19),
        category: 'Transport',
        subcategory: 'Ride',
        account: 'Nubank',
        type: 'Expense',
      ),
    ],
  ),
  TransactionGroup(
    date: DateTime(2026, 2, 18),
    items: [
      TransactionItem(
        name: 'iFood',
        subtitle: 'Food · Delivery',
        amountCents: -6790,
        icon: Icons.restaurant_outlined,
        color: const Color(0xFFEF4444),
        date: DateTime(2026, 2, 18),
        category: 'Food',
        subcategory: 'Delivery',
        account: 'Nubank',
        type: 'Expense',
      ),
      TransactionItem(
        name: 'Salary',
        subtitle: 'Income · Work',
        amountCents: 520000,
        icon: Icons.trending_up,
        color: const Color(0xFF22C55E),
        date: DateTime(2026, 2, 18),
        category: 'Income',
        subcategory: 'Salary',
        account: 'Nubank',
        type: 'Income',
        recurrence: 'Monthly',
      ),
    ],
  ),
  TransactionGroup(
    date: DateTime(2026, 2, 15),
    items: [
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
    ],
  ),
  TransactionGroup(
    date: DateTime(2026, 2, 14),
    items: [
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
    ],
  ),
];

// ── Filter enum ────────────────────────────────────────────────────────────

enum _TransactionFilter { all, expenses, income, recurring }

// ── Page ───────────────────────────────────────────────────────────────────

class TransactionsPage extends StatefulWidget {
  const TransactionsPage({super.key});

  @override
  State<TransactionsPage> createState() => _TransactionsPageState();
}

class _TransactionsPageState extends State<TransactionsPage> {
  _TransactionFilter _filter = _TransactionFilter.all;
  DateTime _selectedMonth = DateTime(2026, 2);

  void _previousMonth() {
    setState(() {
      _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month + 1);
    });
  }

  List<TransactionGroup> get _filteredGroups {
    if (_filter == _TransactionFilter.all) return _kGroups;

    return _kGroups
        .map((group) {
          final filtered = group.items.where((item) {
            switch (_filter) {
              case _TransactionFilter.expenses:
                return item.amountCents < 0;
              case _TransactionFilter.income:
                return item.amountCents > 0;
              case _TransactionFilter.recurring:
                // TODO: filter by recurring flag when API is connected
                return false;
              case _TransactionFilter.all:
                return true;
            }
          }).toList();
          return TransactionGroup(date: group.date, items: filtered);
        })
        .where((g) => g.items.isNotEmpty)
        .toList();
  }

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
              const _SummaryHeader(
                income: _kIncome,
                expense: _kExpense,
                balance: _kBalance,
              ),
              const SizedBox(height: 16),
              _FilterChips(
                selected: _filter,
                onChanged: (f) => setState(() => _filter = f),
              ),
              const SizedBox(height: 16),
              _MonthNavigator(
                month: _selectedMonth,
                onPrevious: _previousMonth,
                onNext: _nextMonth,
              ),
              const SizedBox(height: 8),
              ..._filteredGroups.map(
                (group) => _TransactionGroupSection(group: group),
              ),
              SizedBox(height: bottomPad + 76 + 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Summary Header ─────────────────────────────────────────────────────────

class _SummaryHeader extends StatelessWidget {
  final int income;
  final int expense;
  final int balance;

  const _SummaryHeader({
    required this.income,
    required this.expense,
    required this.balance,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Text(
          'Transactions',
          style: AppTextStyles.h2(t.txtPrimary).copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 22,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 14),
        GlassCard(
          child: Row(
            children: [
              Expanded(
                child: _SummaryColumn(
                  label: 'Income',
                  value: formatCurrency(income),
                  color: t.success,
                ),
              ),
              _VerticalDivider(),
              Expanded(
                child: _SummaryColumn(
                  label: 'Expenses',
                  value: formatCurrency(expense),
                  color: t.error,
                ),
              ),
              _VerticalDivider(),
              Expanded(
                child: _SummaryColumn(
                  label: 'Balance',
                  value: formatCurrency(balance),
                  color: t.success,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SummaryColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryColumn({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      children: [
        Text(
          label,
          style: AppTextStyles.caption(t.txtSecondary).copyWith(fontSize: 11),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTextStyles.mono(color, fontSize: 13).copyWith(
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      width: 1,
      height: 32,
      color: t.divider.withValues(alpha: t.isDark ? 0.4 : 0.6),
    );
  }
}

// ── Filter Chips ────────────────────────────────────────────────────────────

class _FilterChips extends StatelessWidget {
  final _TransactionFilter selected;
  final ValueChanged<_TransactionFilter> onChanged;

  const _FilterChips({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const filters = [
      (_TransactionFilter.all, 'All'),
      (_TransactionFilter.expenses, 'Expenses'),
      (_TransactionFilter.income, 'Income'),
      (_TransactionFilter.recurring, 'Recurring'),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      child: Row(
        children: filters.map((entry) {
          final (filter, label) = entry;
          final isActive = selected == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: AppChip(
              label: label,
              active: isActive,
              onTap: () => onChanged(filter),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Month Navigator ─────────────────────────────────────────────────────────

class _MonthNavigator extends StatelessWidget {
  final DateTime month;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _MonthNavigator({
    required this.month,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final label = formatMonthYear(month);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        GestureDetector(
          onTap: onPrevious,
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : t.primary.withValues(alpha: 0.08),
            ),
            child: Icon(
              Icons.chevron_left,
              size: 20,
              color: t.txtSecondary,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Text(
          label,
          style: AppTextStyles.body(t.txtPrimary).copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
        const SizedBox(width: 16),
        GestureDetector(
          onTap: onNext,
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : t.primary.withValues(alpha: 0.08),
            ),
            child: Icon(
              Icons.chevron_right,
              size: 20,
              color: t.txtSecondary,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Transaction Group Section ───────────────────────────────────────────────

class _TransactionGroupSection extends StatelessWidget {
  final TransactionGroup group;

  const _TransactionGroupSection({required this.group});

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  bool _isYesterday(DateTime date) {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return date.year == yesterday.year &&
        date.month == yesterday.month &&
        date.day == yesterday.day;
  }

  String _groupLabel() {
    if (_isToday(group.date)) return 'TODAY';
    if (_isYesterday(group.date)) return 'YESTERDAY';
    return formatDayHeader(group.date);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final label = _groupLabel();
    final dayStr = formatDayHeader(group.date);
    final headerText = label == dayStr ? label : '$label — $dayStr';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          headerText,
          style: AppTextStyles.caption(t.txtTertiary).copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(
            children: List.generate(group.items.length, (i) {
              return _TransactionRow(
                item: group.items[i],
                showDivider: i < group.items.length - 1,
              );
            }),
          ),
        ),
      ],
    );
  }
}

// ── Transaction Row ─────────────────────────────────────────────────────────

class _TransactionRow extends StatelessWidget {
  final TransactionItem item;
  final bool showDivider;

  const _TransactionRow({required this.item, this.showDivider = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isExpense = item.amountCents < 0;
    final amountColor = isExpense ? t.error : t.success;
    final sign = isExpense ? '-' : '+';
    final amountStr = '$sign${formatCurrency(item.amountCents.abs())}';

    return Column(
      children: [
        GestureDetector(
          onTap: () => context.push('/transactions/detail', extra: item),
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: item.color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(item.icon, color: item.color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.subtitle,
                        style: AppTextStyles.bodySm(t.txtTertiary)
                            .copyWith(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Text(
                  amountStr,
                  style: AppTextStyles.mono(amountColor, fontSize: 13).copyWith(
                    fontWeight: FontWeight.w700,
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
            color: t.divider.withValues(alpha: t.isDark ? 0.35 : 0.6),
          ),
      ],
    );
  }
}
