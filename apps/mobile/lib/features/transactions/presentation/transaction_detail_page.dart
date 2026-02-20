import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/transaction_item.dart';

class TransactionDetailPage extends StatelessWidget {
  final TransactionItem transaction;

  const TransactionDetailPage({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isExpense = transaction.amountCents < 0;
    final amountColor = isExpense ? t.error : t.success;
    final sign = isExpense ? '- ' : '+ ';
    final amountStr = '$sign${formatCurrency(transaction.amountCents.abs())}';

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
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : t.primary.withValues(alpha: 0.08),
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
                        'Detail',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    const SizedBox(width: 36), // balance the back button
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding
                      .copyWith(top: 20, bottom: 24),
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
                                color: transaction.color
                                    .withValues(alpha: 0.18),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                transaction.icon,
                                color: transaction.color,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 14),
                            Text(
                              amountStr,
                              style: AppTextStyles.moneyLg(amountColor)
                                  .copyWith(fontSize: 32),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              transaction.name,
                              style: AppTextStyles.body(t.txtPrimary).copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
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
                              label: 'Category',
                              value: transaction.category,
                            ),
                            _DetailRow(
                              label: 'Subcategory',
                              value: transaction.subcategory,
                            ),
                            _DetailRow(
                              label: 'Account',
                              value: transaction.account,
                            ),
                            _DetailRow(
                              label: 'Date',
                              value: formatDate(transaction.date),
                            ),
                            _DetailRow(
                              label: 'Type',
                              value: isExpense ? 'Expense' : 'Income',
                              valueColor: amountColor,
                            ),
                            _DetailRow(
                              label: 'Recurrence',
                              value: transaction.recurrence == 'None'
                                  ? 'No'
                                  : transaction.recurrence,
                            ),
                            _DetailRow(
                              label: 'Installments',
                              value: '${transaction.installments}x',
                              showDivider: transaction.description != null,
                            ),
                            if (transaction.description != null)
                              _DetailRow(
                                label: 'Description',
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
                        label: 'Delete',
                        danger: true,
                        onPressed: () {
                          // TODO: call delete endpoint
                          context.pop();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: PrimaryButton(
                        label: 'Edit',
                        onPressed: () {
                          // TODO: navigate to edit screen
                        },
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
            children: [
              Text(
                label,
                style: AppTextStyles.body(t.txtSecondary).copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                value,
                style: AppTextStyles.body(valueColor ?? t.txtPrimary).copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
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
