import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/account_visuals.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/account.dart';
import '../providers/accounts_provider.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class AccountsPage extends ConsumerWidget {
  const AccountsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountsAsync = ref.watch(accountsNotifierProvider);
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
              const PageHeader(title: 'Contas'),
              const SizedBox(height: 20),
              accountsAsync.when(
                loading: () => const _AccountsSummary(accounts: []),
                error: (_, s) => const _AccountsSummary(accounts: []),
                data: (accounts) => _AccountsSummary(accounts: accounts),
              ),
              const SizedBox(height: 24),
              accountsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => _ErrorView(
                  onRetry: () =>
                      ref.read(accountsNotifierProvider.notifier).refresh(),
                ),
                data: (accounts) => _AccountsSection(accounts: accounts),
              ),
              SizedBox(height: bottomPad + 76 + 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Summary (totalizador) ────────────────────────────────────────────────────
//
// Total held in non-credit accounts (hero) plus the credit-card view: current
// invoice to pay, available credit limit, and the cards' net balance. Mirrors
// the web accounts summary.

class _AccountsSummary extends StatelessWidget {
  const _AccountsSummary({required this.accounts});

  final List<Account> accounts;

  @override
  Widget build(BuildContext context) {
    var totalInAccounts = 0;
    var creditBalance = 0;
    var currentInvoice = 0;
    var availableLimit = 0;

    for (final a in accounts) {
      if (a.isCredit) {
        creditBalance += a.balanceCents;
        currentInvoice += a.balanceCents.abs();
        final free = (a.creditLimitCents ?? 0) - a.balanceCents.abs();
        if (free > 0) availableLimit += free;
      } else {
        totalInAccounts += a.balanceCents;
      }
    }

    return SummaryPanel(
      eyebrow: 'TOTAL EM CONTAS',
      valueCents: totalInAccounts,
      stats: [
        SummaryStat(label: 'FATURA ATUAL', valueCents: currentInvoice),
        SummaryStat(label: 'DISPONÍVEL', valueCents: availableLimit),
        SummaryStat(label: 'SALDO CARTÕES', valueCents: creditBalance),
      ],
    );
  }
}

// ── Accounts Section ───────────────────────────────────────────────────────

class _AccountsSection extends StatelessWidget {
  final List<Account> accounts;

  const _AccountsSection({required this.accounts});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Minhas contas', style: AppTextStyles.h3(t.txtPrimary)),
            const Spacer(),
            Text(
              '${accounts.length} contas',
              style: AppTextStyles.bodySm(t.txtTertiary),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ...accounts.map((account) => _AccountCard(account: account)),
      ],
    );
  }
}

// ── Account Card ───────────────────────────────────────────────────────────

class _AccountCard extends StatelessWidget {
  final Account account;

  const _AccountCard({required this.account});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        onTap: () => context.push('/accounts/${account.id}'),
        padding: const EdgeInsets.all(16),
        borderRadius: AppRadius.xlAll,
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: t.accent.withValues(alpha: 0.14),
                borderRadius: AppRadius.lgAll,
              ),
              child: Icon(accountTypeIcon(account.type),
                  color: t.accent, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          account.name,
                          style: AppTextStyles.body(t.txtPrimary).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (account.isDefault) ...[
                        const SizedBox(width: 6),
                        const TonalTag('Padrão'),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    accountTypeLabel(account.type),
                    style: AppTextStyles.bodySm(t.txtTertiary),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Money(account.balanceCents, size: 15, weight: FontWeight.w600),
                const SizedBox(height: 2),
                Icon(
                  LucideIcons.chevronRight,
                  size: 16,
                  color: t.txtDisabled,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Error View ─────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Center(
      child: Column(
        children: [
          Icon(LucideIcons.alertCircle, color: t.error, size: 32),
          const SizedBox(height: 8),
          Text(
            'Não foi possível carregar as contas',
            style: AppTextStyles.body(t.txtSecondary),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Tentar novamente')),
        ],
      ),
    );
  }
}
