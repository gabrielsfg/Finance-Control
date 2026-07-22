import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/transaction_item.dart';
import '../providers/transaction_filter_provider.dart';
import '../providers/transaction_filtered_provider.dart';
import '../providers/transaction_provider.dart';
import 'filter_sheet.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class TransactionsPage extends ConsumerStatefulWidget {
  const TransactionsPage({super.key});

  @override
  ConsumerState<TransactionsPage> createState() => _TransactionsPageState();
}

class _TransactionsPageState extends ConsumerState<TransactionsPage> {
  final _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      ref.read(transactionFilterProvider.notifier).updateSearch(value);
    });
  }

  void _openFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const FilterSheet(),
    );
  }

  List<TransactionGroup> _groupByDate(List<TransactionItem> items) {
    final map = <DateTime, List<TransactionItem>>{};
    for (final item in items) {
      final day = DateTime(item.date.year, item.date.month, item.date.day);
      map.putIfAbsent(day, () => []).add(item);
    }
    final keys = map.keys.toList()..sort((a, b) => b.compareTo(a));
    return keys.map((d) => TransactionGroup(date: d, items: map[d]!)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final asyncTx = ref.watch(transactionsNotifierProvider);
    final filtered = ref.watch(transactionFilteredProvider);
    final filterState = ref.watch(transactionFilterProvider);
    final activeCount = filterState.activeFilterCount;

    return AppBackground(
      scrollable: false,
      child: SafeArea(
        bottom: false,
        child: asyncTx.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erro: $e')),
          data: (_) {
            final groups = _groupByDate(filtered);

            final income = filtered
                .where((t) => t.amountCents > 0)
                .fold(0, (sum, t) => sum + t.amountCents);
            final expense = filtered
                .where((t) => t.amountCents < 0)
                .fold(0, (sum, t) => sum + t.amountCents.abs());
            final balance = income - expense;

            return CustomScrollView(
              slivers: [
                SliverPadding(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      const SizedBox(height: 8),
                      _SummaryHeader(
                        income: income,
                        expense: expense,
                        balance: balance,
                      ),
                      const SizedBox(height: 16),
                      _SearchBar(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        filterCount: activeCount,
                        onFilterTap: _openFilterSheet,
                      ),
                      const SizedBox(height: 8),
                    ]),
                  ),
                ),
                if (groups.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 80),
                        child: Text(
                          'Nenhuma transação encontrada',
                          style: AppTextStyles.body(
                            AppThemeTokens.of(context).txtTertiary,
                          ),
                        ),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: AppSpacing.screenPadding.copyWith(
                      top: 0,
                      bottom: bottomPad + 76 + 24,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) =>
                            _TransactionGroupSection(group: groups[index]),
                        childCount: groups.length,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ── Search Bar ──────────────────────────────────────────────────────────────

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final int filterCount;
  final VoidCallback onFilterTap;

  const _SearchBar({
    required this.controller,
    required this.onChanged,
    required this.filterCount,
    required this.onFilterTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      children: [
        Expanded(
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: t.surfaceEl,
              borderRadius: AppRadius.baseAll,
              border: Border.all(color: t.mist),
            ),
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Buscar transações...',
                hintStyle:
                    AppTextStyles.body(t.txtTertiary).copyWith(fontSize: 14),
                prefixIcon:
                    Icon(Icons.search_rounded, size: 20, color: t.txtTertiary),
                border: InputBorder.none,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: onFilterTap,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: filterCount > 0
                      ? t.accent.withValues(alpha: 0.15)
                      : t.surfaceEl,
                  borderRadius: AppRadius.baseAll,
                  border: Border.all(
                    color: filterCount > 0
                        ? t.accent.withValues(alpha: 0.4)
                        : t.mist,
                  ),
                ),
                child: Icon(
                  Icons.tune_rounded,
                  size: 20,
                  color: filterCount > 0 ? t.accent : t.txtTertiary,
                ),
              ),
              if (filterCount > 0)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: t.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$filterCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PageHeader(title: 'Extrato'),
        const SizedBox(height: 16),
        SummaryPanel(
          eyebrow: 'SALDO DO PERÍODO',
          valueCents: balance,
          stats: [
            SummaryStat(
              label: 'RECEITAS',
              valueCents: income,
              valueColor: t.mossLift,
            ),
            SummaryStat(
              label: 'DESPESAS',
              valueCents: expense,
              valueColor: t.clayLift,
            ),
          ],
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

  String _groupLabel(AppLocale fmt) {
    if (_isToday(group.date)) return 'HOJE';
    if (_isYesterday(group.date)) return 'ONTEM';
    return fmt.formatDayHeader(group.date);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final label = _groupLabel(fmt);
    final dayStr = fmt.formatDayHeader(group.date);
    final headerText = label == dayStr ? label : '$label — $dayStr';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          headerText,
          style: AppTextStyles.eyebrow(t.txtTertiary),
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
    final signalColor = isExpense ? t.clay : t.moss;

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
                    color: isExpense ? t.expenseBg : t.incomeBg,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      isExpense
                          ? Icons.arrow_upward_rounded
                          : Icons.arrow_downward_rounded,
                      size: 20,
                      color: signalColor,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.subCategoryName,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.accountName,
                        style: AppTextStyles.bodySm(t.txtTertiary)
                            .copyWith(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Money(
                  item.amountCents,
                  signed: true,
                  size: 14,
                  weight: FontWeight.w600,
                ),
              ],
            ),
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            color: t.mist,
          ),
      ],
    );
  }
}
