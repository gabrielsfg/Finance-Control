import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../../core/utils/app_locale.dart';
import '../../../features/analytics/presentation/home_analytics_view.dart';
import '../../../features/analytics/presentation/home_filter_sheet.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/data/models/account.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../../goals/data/goal_models.dart';
import '../../goals/providers/goal_provider.dart';
import '../../recurrences/data/recurrence_models.dart';
import '../../recurrences/providers/recurrence_provider.dart';
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
            data: (state) {
              final summary = state.summary;
              final accounts =
                  ref.watch(accountsNotifierProvider).valueOrNull ?? const [];
              final goals =
                  ref.watch(goalsProvider).valueOrNull ?? const <Goal>[];
              final activeGoals =
                  goals.where((g) => g.status == GoalStatus.active).toList();
              final recurring = ref
                      .watch(recurrenceProvider)
                      .valueOrNull
                      ?.recurring ??
                  const <RecurringItem>[];
              final topCategories = summary?.topCategories ?? const [];
              final recent = summary?.recentTransactions ?? const [];

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  _Header(
                    startDate: state.startDate,
                    isDark: Theme.of(context).brightness == Brightness.dark,
                    onThemeToggle: () {
                      final dark =
                          Theme.of(context).brightness == Brightness.dark;
                      ref.read(localSettingsProvider.notifier).setThemeMode(
                          dark ? ThemeMode.light : ThemeMode.dark);
                    },
                    onFilterTap: () => _openFilterSheet(context),
                  ),
                  const SizedBox(height: 16),
                  _ViewToggle(
                    showAnalytics: _showAnalytics,
                    onToggle: (v) => setState(() => _showAnalytics = v),
                  ),
                  const SizedBox(height: 18),
                  if (!_showAnalytics) ...[
                    _HeroSummary(
                      summary: summary,
                      monthLabel: AppLocaleScope.of(context)
                          .formatMonthYear(state.startDate),
                    ),
                    const SizedBox(height: 14),
                    _BudgetCard(summary: summary),
                    const SizedBox(height: 26),
                    _AccountsPreview(accounts: accounts),
                    const SizedBox(height: 26),
                    _TopCategoriesSection(categories: topCategories),
                    const SizedBox(height: 26),
                    _GoalsPreview(goals: activeGoals),
                    const SizedBox(height: 26),
                    _RecurrencesPreview(items: recurring),
                    const SizedBox(height: 26),
                    _RecentTransactionsSection(transactions: recent),
                  ] else
                    const HomeAnalyticsView(),
                  SizedBox(height: bottomPad + 76 + 24),
                ],
              );
            },
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

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.startDate,
    required this.onFilterTap,
    required this.isDark,
    required this.onThemeToggle,
  });

  final DateTime startDate;
  final VoidCallback onFilterTap;
  final bool isDark;
  final VoidCallback onThemeToggle;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('Olá', style: AppTextStyles.body(t.txtSecondary)),
                  const SizedBox(width: 6),
                  Icon(LucideIcons.hand, size: 16, color: t.gold),
                ],
              ),
              const SizedBox(height: 3),
              Text(fmt.formatMonthYear(startDate),
                  style: AppTextStyles.h1(t.txtPrimary)),
            ],
          ),
        ),
        _IconButton(
          icon: isDark ? LucideIcons.sun : LucideIcons.moon,
          onTap: onThemeToggle,
        ),
        const SizedBox(width: 10),
        _IconButton(icon: LucideIcons.slidersHorizontal, onTap: onFilterTap),
      ],
    );
  }
}

class _IconButton extends StatelessWidget {
  const _IconButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: t.mist),
        ),
        child: Icon(icon, size: 18, color: t.txtSecondary),
      ),
    );
  }
}

// ── View toggle (segmented control) ─────────────────────────────────────────

class _ViewToggle extends StatelessWidget {
  const _ViewToggle({required this.showAnalytics, required this.onToggle});

  final bool showAnalytics;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      height: 40,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.mist),
      ),
      child: Row(
        children: [
          _Tab(label: 'Visão geral', selected: !showAnalytics, onTap: () => onToggle(false)),
          _Tab(label: 'Análises', selected: showAnalytics, onTap: () => onToggle(true)),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: selected ? t.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            boxShadow: selected && !t.isDark ? AppShadows.cardLight : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTextStyles.bodySm(selected ? t.txtPrimary : t.txtTertiary)
                .copyWith(fontWeight: selected ? FontWeight.w600 : FontWeight.w500),
          ),
        ),
      ),
    );
  }
}

// ── Hero summary (dark panel + flow bar) ─────────────────────────────────────

class _HeroSummary extends StatelessWidget {
  const _HeroSummary({required this.summary, required this.monthLabel});

  final HomeSummary? summary;
  final String monthLabel;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final balance = summary?.balance ?? 0;

    return HeroPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Saldo do período', style: AppTextStyles.eyebrow(t.panelMuted)),
          const SizedBox(height: 10),
          Money(
            balance,
            size: 44,
            weight: FontWeight.w600,
            color: balance >= 0 ? t.panelText : t.clayLift,
            symbolColor: t.panelMuted,
            symbolScale: 0.34,
            centsScale: 0.44,
          ),
          const SizedBox(height: 26),
          FlowBar(
            incomeCents: (summary?.totalIncome ?? 0).abs(),
            expenseCents: (summary?.totalExpenses ?? 0).abs(),
            title: 'Entradas e saídas',
            periodLabel: monthLabel,
            showNet: false,
          ),
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
    final percent =
        summary != null ? (summary!.budgetSpentPercentage / 100).clamp(0.0, 1.0) : 0.0;
    final pctValue = summary?.budgetSpentPercentage.round() ?? 0;
    final pctColor = pctValue >= 100
        ? t.error
        : pctValue >= 80
            ? t.warning
            : t.accent;

    return GlassCard(
      onTap: () => context.go('/budgets'),
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
                    Text('ORÇAMENTO', style: AppTextStyles.eyebrow(t.txtSecondary)),
                    const SizedBox(height: 5),
                    Text('Período atual', style: AppTextStyles.h3(t.txtPrimary)),
                  ],
                ),
              ),
              Text('$pctValue%',
                  style: AppTextStyles.mono(pctColor, fontSize: 16)
                      .copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 14),
          AppProgressBar(percent: percent),
          const SizedBox(height: 12),
          Row(
            children: [
              if (summary != null)
                Row(
                  children: [
                    Money(summary!.budgetTotalSpent,
                        size: 13, color: t.txtSecondary),
                    Text('  gasto', style: AppTextStyles.bodySm(t.txtTertiary)),
                  ],
                ),
              const Spacer(),
              Text('Ver orçamento →',
                  style: AppTextStyles.eyebrow(t.accent).copyWith(letterSpacing: 0.6)),
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
    final top = categories.take(3).toList();
    return _HomeCard(
      title: 'Principais categorias',
      child: top.isEmpty
          ? const _EmptyHint('Nenhum gasto por categoria neste período.')
          : Column(
              children: List.generate(
                top.length,
                (i) => _CategoryRow(
                  data: top[i],
                  showDivider: i < top.length - 1,
                ),
              ),
            ),
    );
  }
}

// ── Empty hint ────────────────────────────────────────────────────────────────

class _EmptyHint extends StatelessWidget {
  const _EmptyHint(this.message);

  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return SizedBox(
      width: double.infinity,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: AppTextStyles.bodySm(t.txtTertiary),
        ),
      ),
    );
  }
}

// ── Home card (standard section container) ──────────────────────────────────

class _HomeCard extends StatelessWidget {
  const _HomeCard({
    required this.title,
    this.actionLabel,
    this.onAction,
    required this.child,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title, style: AppTextStyles.h3(t.txtPrimary)),
              ),
              if (actionLabel != null)
                GestureDetector(
                  onTap: onAction,
                  behavior: HitTestBehavior.opaque,
                  child: Text(
                    '$actionLabel →',
                    style: AppTextStyles.eyebrow(t.accent)
                        .copyWith(letterSpacing: 0.4),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow({required this.data, this.showDivider = true});

  final TopCategorySummary data;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 11),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: t.accent.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(AppRadius.base),
                ),
                child: Text(
                  data.categoryName.isNotEmpty
                      ? data.categoryName[0].toUpperCase()
                      : '?',
                  style: AppTextStyles.h3(t.accent),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  data.categoryName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.body(t.txtPrimary)
                      .copyWith(fontWeight: FontWeight.w500, fontSize: 14),
                ),
              ),
              const SizedBox(width: 10),
              Money(data.totalSpentCents, size: 14, weight: FontWeight.w600),
            ],
          ),
        ),
        if (showDivider) Container(height: 1, color: t.mist),
      ],
    );
  }
}

// ── Recent Transactions ───────────────────────────────────────────────────────

class _RecentTransactionsSection extends StatelessWidget {
  const _RecentTransactionsSection({required this.transactions});

  final List<RecentTransactionSummary> transactions;

  @override
  Widget build(BuildContext context) {
    final items = transactions.take(5).toList();
    // Card width sized so ~2.5 cards peek in, hinting the list scrolls.
    final cardW = (MediaQuery.sizeOf(context).width - 40 - 32) / 2.5;

    return _HomeCard(
      title: 'Transações recentes',
      actionLabel: 'Ver tudo',
      onAction: () => context.go('/transactions'),
      child: items.isEmpty
          ? const _EmptyHint('Nenhuma transação registrada ainda.')
          : SizedBox(
              height: 148,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.zero,
                clipBehavior: Clip.none,
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (_, i) =>
                    _TransactionMiniCard(data: items[i], width: cardW),
              ),
            ),
    );
  }
}

class _TransactionMiniCard extends StatelessWidget {
  const _TransactionMiniCard({required this.data, required this.width});

  final RecentTransactionSummary data;
  final double width;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final color = data.isExpense ? t.clay : t.moss;

    return Container(
      width: width,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.cardAll,
        border: Border.all(color: t.mist),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(AppRadius.base),
            ),
            child: Icon(
              data.isExpense
                  ? LucideIcons.arrowDownRight
                  : LucideIcons.arrowUpRight,
              size: 16,
              color: color,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            data.description,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.body(t.txtPrimary)
                .copyWith(fontWeight: FontWeight.w500, fontSize: 13),
          ),
          const SizedBox(height: 2),
          Text(
            data.categoryName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.mono(t.txtTertiary, fontSize: 10),
          ),
          const SizedBox(height: 10),
          Money(data.valueCents, size: 14, signed: true, weight: FontWeight.w600),
        ],
      ),
    );
  }
}

// ── Accounts preview ──────────────────────────────────────────────────────────

class _AccountsPreview extends StatelessWidget {
  const _AccountsPreview({required this.accounts});

  final List<Account> accounts;

  // Rank by magnitude: non-credit by balance, credit by current invoice.
  int _magnitude(Account a) => a.isCredit ? a.balanceCents.abs() : a.balanceCents;

  @override
  Widget build(BuildContext context) {
    final sorted = [...accounts]
      ..sort((a, b) => _magnitude(b).compareTo(_magnitude(a)));
    final top = sorted.take(3).toList();

    return _HomeCard(
      title: 'Contas',
      actionLabel: 'Ver todas',
      onAction: () => context.go('/accounts'),
      child: top.isEmpty
          ? const _EmptyHint('Nenhuma conta cadastrada ainda.')
          : Column(
              children: List.generate(
                top.length,
                (i) => _AccountRow(
                  account: top[i],
                  showDivider: i < top.length - 1,
                ),
              ),
            ),
    );
  }
}

class _AccountRow extends StatelessWidget {
  const _AccountRow({required this.account, this.showDivider = true});

  final Account account;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isCredit = account.isCredit;
    final label = isCredit ? 'Fatura atual' : 'Saldo';
    final value = isCredit ? account.balanceCents.abs() : account.balanceCents;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 11),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: t.accent.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(AppRadius.base),
                ),
                child: Icon(
                  isCredit ? LucideIcons.creditCard : LucideIcons.wallet,
                  size: 18,
                  color: t.accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      account.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.body(t.txtPrimary)
                          .copyWith(fontWeight: FontWeight.w500, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(label,
                        style: AppTextStyles.mono(t.txtTertiary, fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Money(value, size: 14, weight: FontWeight.w600),
            ],
          ),
        ),
        if (showDivider) Container(height: 1, color: t.mist),
      ],
    );
  }
}

// ── Goals preview ─────────────────────────────────────────────────────────────

class _GoalsPreview extends StatelessWidget {
  const _GoalsPreview({required this.goals});

  final List<Goal> goals;

  @override
  Widget build(BuildContext context) {
    final top = goals.take(3).toList();

    return _HomeCard(
      title: 'Metas',
      actionLabel: 'Ver todas',
      onAction: () => context.push('/goals'),
      child: top.isEmpty
          ? const _EmptyHint('Nenhuma meta ativa ainda.')
          : Column(
              children: List.generate(
                top.length,
                (i) =>
                    _GoalRow(goal: top[i], showDivider: i < top.length - 1),
              ),
            ),
    );
  }
}

class _GoalRow extends StatelessWidget {
  const _GoalRow({required this.goal, this.showDivider = true});

  final Goal goal;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      goal.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.body(t.txtPrimary)
                          .copyWith(fontWeight: FontWeight.w500, fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${(goal.progress * 100).round()}%',
                    style: AppTextStyles.mono(t.accent, fontSize: 12)
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              AppProgressBar(percent: goal.progress),
              const SizedBox(height: 8),
              Row(
                children: [
                  Money(goal.currentAmount, size: 12, color: t.txtSecondary),
                  Text('  de  ', style: AppTextStyles.bodySm(t.txtTertiary)),
                  Money(goal.targetAmount, size: 12, color: t.txtTertiary),
                ],
              ),
            ],
          ),
        ),
        if (showDivider) Container(height: 1, color: t.mist),
      ],
    );
  }
}

// ── Upcoming recurrences preview ───────────────────────────────────────────────

class _RecurrencesPreview extends StatelessWidget {
  const _RecurrencesPreview({required this.items});

  final List<RecurringItem> items;

  @override
  Widget build(BuildContext context) {
    final active = items.where((r) => r.isActive).toList()
      ..sort((a, b) => a.nextCharge.compareTo(b.nextCharge));
    final top = active.take(3).toList();

    return _HomeCard(
      title: 'Próximas recorrências',
      actionLabel: 'Ver todas',
      onAction: () => context.push('/recurring'),
      child: top.isEmpty
          ? const _EmptyHint('Nenhuma recorrência ativa ainda.')
          : Column(
              children: List.generate(
                top.length,
                (i) => _RecurrenceRow(
                    item: top[i], showDivider: i < top.length - 1),
              ),
            ),
    );
  }
}

class _RecurrenceRow extends StatelessWidget {
  const _RecurrenceRow({required this.item, this.showDivider = true});

  final RecurringItem item;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final title =
        item.description.isNotEmpty ? item.description : item.subCategoryName;
    final color = item.isIncome ? t.moss : t.clay;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 11),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(AppRadius.base),
                ),
                child: Icon(LucideIcons.repeat, size: 17, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.body(t.txtPrimary)
                          .copyWith(fontWeight: FontWeight.w500, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item.recurrence.labelPt} · ${fmt.formatDate(item.nextCharge)}',
                      style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Money(item.value, size: 14, weight: FontWeight.w600, color: color),
            ],
          ),
        ),
        if (showDivider) Container(height: 1, color: t.mist),
      ],
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
        children: [
          Icon(LucideIcons.wifiOff, size: 44, color: t.txtTertiary),
          const SizedBox(height: 14),
          Text('Não foi possível carregar',
              style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 6),
          Text(message,
              style: AppTextStyles.bodySm(t.txtTertiary),
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          SizedBox(
            width: 170,
            child: PrimaryButton(label: 'Tentar de novo', onPressed: onRetry),
          ),
        ],
      ),
    );
  }
}
