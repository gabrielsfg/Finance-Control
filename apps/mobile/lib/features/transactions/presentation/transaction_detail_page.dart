import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/transaction_item.dart';
import '../providers/transaction_provider.dart';

class TransactionDetailPage extends ConsumerWidget {
  final TransactionItem transaction;

  const TransactionDetailPage({super.key, required this.transaction});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final actionState = ref.watch(transactionActionProvider);
    final isExpense = transaction.amountCents < 0;
    final signalColor = isExpense ? t.clay : t.moss;

    ref.listen(transactionActionProvider, (_, next) {
      if (next is TransactionActionSuccess) {
        ref.read(transactionActionProvider.notifier).reset();
        context.pop();
      } else if (next is TransactionActionError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
        ref.read(transactionActionProvider.notifier).reset();
      }
    });

    final isLoading = actionState is TransactionActionLoading;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          child: Column(
            children: [
              // ── App bar ──────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.surfaceEl,
                          border: Border.all(color: t.mist),
                        ),
                        child: Icon(
                          Icons.arrow_back,
                          size: 18,
                          color: t.txtPrimary,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Detalhes',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.h3(t.txtPrimary),
                      ),
                    ),
                    const SizedBox(width: 36),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  padding:
                      AppSpacing.screenPadding.copyWith(top: 20, bottom: 24),
                  child: Column(
                    children: [
                      // ── Hero card ──────────────────────────────────────
                      GlassCard(
                        child: Column(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: isExpense ? t.expenseBg : t.incomeBg,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Icon(
                                  isExpense
                                      ? Icons.arrow_upward_rounded
                                      : Icons.arrow_downward_rounded,
                                  size: 28,
                                  color: signalColor,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                            Money(
                              transaction.amountCents,
                              signed: true,
                              size: 32,
                              weight: FontWeight.w700,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              transaction.subCategoryName,
                              style: AppTextStyles.h3(t.txtPrimary),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ── Detail rows ────────────────────────────────────
                      GlassCard(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 4),
                        child: Column(
                          children: [
                            _DetailRow(
                              label: 'Subcategoria',
                              value: transaction.subCategoryName,
                            ),
                            _DetailRow(
                              label: 'Conta',
                              value: transaction.accountName,
                            ),
                            _DetailRow(
                              label: 'Data',
                              value: fmt.formatDate(transaction.date),
                            ),
                            _DetailRow(
                              label: 'Tipo',
                              value: isExpense ? 'Despesa' : 'Receita',
                              valueColor: signalColor,
                            ),
                            _DetailRow(
                              label: 'Pagamento',
                              value: switch (transaction.paymentType) {
                                'OneTime' => 'À vista',
                                'Installment' => 'Parcelado',
                                'Recurring' => 'Recorrente',
                                _ => transaction.paymentType,
                              },
                            ),
                            _DetailRow(
                              label: 'Forma',
                              value: transaction.paymentMethod == 'Credit'
                                  ? 'Crédito'
                                  : 'Débito',
                            ),
                            if (transaction.paymentType == 'Recurring')
                              _DetailRow(
                                label: 'ID da recorrência',
                                value:
                                    '#${transaction.recurringTransactionId}',
                              ),
                            if (transaction.paymentType == 'Installment' &&
                                transaction.installmentNumber != null)
                              _DetailRow(
                                label: 'Parcela',
                                value:
                                    '${transaction.installmentNumber}/${transaction.totalInstallments}',
                              ),
                            if (transaction.budgetId != null)
                              _DetailRow(
                                label: 'Orçamento',
                                value: '#${transaction.budgetId}',
                              ),
                            if (transaction.description != null)
                              _DetailRow(
                                label: 'Descrição',
                                value: transaction.description!,
                                showDivider: false,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Action buttons ────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(
                  24,
                  8,
                  24,
                  MediaQuery.viewPaddingOf(context).bottom + 16,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: AppOutlineButton(
                        label: 'Excluir',
                        danger: true,
                        onPressed: isLoading
                            ? null
                            : () async {
                                final confirmed =
                                    await showDeleteConfirmDialog(
                                  context: context,
                                  title: 'Excluir transação',
                                  itemName: transaction.subCategoryName,
                                );
                                if (confirmed == true && context.mounted) {
                                  ref
                                      .read(transactionActionProvider.notifier)
                                      .delete(transaction.id);
                                }
                              },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: PrimaryButton(
                        label: isLoading ? 'Carregando...' : 'Editar',
                        onPressed: isLoading
                            ? null
                            : () => context.push(
                                  '/transactions/edit',
                                  extra: transaction,
                                ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Detail Row ──────────────────────────────────────────────────────────────

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool showDivider;

  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                label,
                style: AppTextStyles.eyebrow(t.txtSecondary),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Text(
                  value,
                  textAlign: TextAlign.end,
                  style: AppTextStyles.body(valueColor ?? t.txtPrimary).copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
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
