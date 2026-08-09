import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/account_visuals.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../transactions/providers/transaction_filter_provider.dart';
import '../data/models/account_detail.dart';
import '../providers/accounts_provider.dart';

class AccountDetailPage extends ConsumerWidget {
  const AccountDetailPage({super.key, required this.accountId});

  final int accountId;

  Future<void> _delete(
      BuildContext context, WidgetRef ref, AccountDetail detail) async {
    final confirmed = await showDeleteConfirmDialog(
      context: context,
      title: 'Excluir conta',
      itemName: detail.name,
    );
    if (confirmed != true) return;
    await ref.read(accountsNotifierProvider.notifier).deleteAccount(accountId);
    if (context.mounted) context.pop();
  }

  void _seeAll(BuildContext context, WidgetRef ref, AccountDetail detail) {
    ref
        .read(transactionFilterProvider.notifier)
        .updateAccount(detail.id, detail.name);
    context.go('/transactions');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(accountDetailProvider(accountId));
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: async.when(
              loading: () => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  PageHeader(
                      title: 'Conta',
                      showBack: true,
                      onBack: () => context.pop()),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 120),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ],
              ),
              error: (e, _) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  PageHeader(
                      title: 'Conta',
                      showBack: true,
                      onBack: () => context.pop()),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 80),
                    child: Center(
                      child: Text('Não foi possível carregar a conta',
                          style: AppTextStyles.bodySm(t.txtTertiary)),
                    ),
                  ),
                ],
              ),
              data: (detail) {
                final recent = detail.recentTransactions.take(5).toList();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    PageHeader(
                      eyebrow: accountTypeLabel(detail.type).toUpperCase(),
                      title: detail.name,
                      showBack: true,
                      onBack: () => context.pop(),
                    ),
                    const SizedBox(height: 18),
                    _BalancePanel(detail: detail),
                    const SizedBox(height: 22),
                    _RecentTransactions(
                      transactions: recent,
                      onSeeAll: () => _seeAll(context, ref, detail),
                    ),
                    const SizedBox(height: 24),
                    _Actions(
                      onNewTransaction: () => context.push('/transactions/add'),
                      onDelete: () => _delete(context, ref, detail),
                      onEdit: () =>
                          context.push('/accounts/${detail.id}/edit'),
                    ),
                    SizedBox(height: bottomPad + 24),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

// ── Balance panel ────────────────────────────────────────────────────────────

class _BalancePanel extends StatelessWidget {
  const _BalancePanel({required this.detail});

  final AccountDetail detail;

  @override
  Widget build(BuildContext context) {
    if (detail.isCredit) {
      final invoice = detail.balanceCents.abs();
      final limit = detail.creditLimitCents ?? 0;
      final available = (limit - invoice) > 0 ? (limit - invoice) : 0;
      return SummaryPanel(
        eyebrow: 'FATURA ATUAL',
        valueCents: invoice,
        stats: [
          SummaryStat(label: 'LIMITE', valueCents: limit),
          SummaryStat(label: 'DISPONÍVEL', valueCents: available),
        ],
      );
    }
    return SummaryPanel(
      eyebrow: 'SALDO ATUAL',
      valueCents: detail.balanceCents,
    );
  }
}

// ── Recent transactions ──────────────────────────────────────────────────────

class _RecentTransactions extends StatelessWidget {
  const _RecentTransactions({required this.transactions, required this.onSeeAll});

  final List<RecentTransaction> transactions;
  final VoidCallback onSeeAll;

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
                child: Text('Transações recentes',
                    style: AppTextStyles.h3(t.txtPrimary)),
              ),
              GestureDetector(
                onTap: onSeeAll,
                behavior: HitTestBehavior.opaque,
                child: Text('Ver todas →',
                    style: AppTextStyles.eyebrow(t.accent)
                        .copyWith(letterSpacing: 0.4)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (transactions.isEmpty)
            SizedBox(
              width: double.infinity,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text('Nenhuma transação nesta conta ainda.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodySm(t.txtTertiary)),
              ),
            )
          else
            ...List.generate(transactions.length, (i) {
              return _TxRow(
                tx: transactions[i],
                showDivider: i < transactions.length - 1,
              );
            }),
        ],
      ),
    );
  }
}

class _TxRow extends StatelessWidget {
  const _TxRow({required this.tx, this.showDivider = true});

  final RecentTransaction tx;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final color = tx.isExpense ? t.clay : t.moss;
    final title = (tx.description?.isNotEmpty ?? false)
        ? tx.description!
        : tx.subCategoryName;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 11),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(AppRadius.base),
                ),
                child: Icon(
                  tx.isExpense
                      ? LucideIcons.arrowDownRight
                      : LucideIcons.arrowUpRight,
                  size: 16,
                  color: color,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                            fontWeight: FontWeight.w500, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(tx.categoryName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.mono(t.txtTertiary, fontSize: 10)),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Money(
                tx.isExpense ? -tx.valueCents.abs() : tx.valueCents.abs(),
                size: 14,
                weight: FontWeight.w600,
                signed: true,
              ),
            ],
          ),
        ),
        if (showDivider) Container(height: 1, color: t.mist),
      ],
    );
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

class _Actions extends StatelessWidget {
  const _Actions({
    required this.onNewTransaction,
    required this.onDelete,
    required this.onEdit,
  });

  final VoidCallback onNewTransaction;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: PrimaryButton(
            label: 'Nova transação',
            icon: const Icon(LucideIcons.plus, size: 16, color: Colors.white),
            onPressed: onNewTransaction,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onDelete,
                icon: Icon(LucideIcons.trash2, size: 15, color: t.error),
                label: Text('Excluir',
                    style: AppTextStyles.body(t.error)
                        .copyWith(fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  side: BorderSide(color: t.error.withValues(alpha: 0.5)),
                  shape:
                      RoundedRectangleBorder(borderRadius: AppRadius.lgAll),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onEdit,
                icon: Icon(LucideIcons.pencil, size: 15, color: t.accent),
                label: Text('Editar',
                    style: AppTextStyles.body(t.accent)
                        .copyWith(fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  side: BorderSide(color: t.accent.withValues(alpha: 0.5)),
                  shape:
                      RoundedRectangleBorder(borderRadius: AppRadius.lgAll),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
