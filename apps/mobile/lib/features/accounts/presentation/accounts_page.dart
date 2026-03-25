import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
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
              const _Header(),
              const SizedBox(height: 20),
              accountsAsync.when(
                loading: () => const _NetWorthCard(
                  netWorthCents: 0,
                  includedCount: 0,
                  excludedCount: 0,
                  totalCount: 0,
                ),
                error: (_, s) => const _NetWorthCard(
                  netWorthCents: 0,
                  includedCount: 0,
                  excludedCount: 0,
                  totalCount: 0,
                ),
                data: (accounts) {
                  final netWorth = accounts
                      .fold(0, (sum, a) => sum + a.balanceCents);
                  return _NetWorthCard(
                    netWorthCents: netWorth,
                    includedCount: accounts.length,
                    excludedCount: 0,
                    totalCount: accounts.length,
                  );
                },
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

// ── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      children: [
        const SizedBox(width: 36),
        Expanded(
          child: Text(
            'Accounts',
            textAlign: TextAlign.center,
            style: AppTextStyles.body(t.txtPrimary).copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
        ),
        const ThemeToggleButton(),
        const SizedBox(width: 10),
        _AddAccountButton(),
      ],
    );
  }
}

class _AddAccountButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/accounts/create'),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.primaryGradient,
          boxShadow: AppShadows.fabShadow,
        ),
        child: const Icon(LucideIcons.plus, color: Colors.white, size: 18),
      ),
    );
  }
}

// ── Net Worth Card ─────────────────────────────────────────────────────────

class _NetWorthCard extends StatelessWidget {
  final int netWorthCents;
  final int includedCount;
  final int excludedCount;
  final int totalCount;

  const _NetWorthCard({
    required this.netWorthCents,
    required this.includedCount,
    required this.excludedCount,
    required this.totalCount,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'NET WORTH',
            textAlign: TextAlign.center,
            style: AppTextStyles.caption(t.txtTertiary).copyWith(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            formatCurrency(netWorthCents),
            textAlign: TextAlign.center,
            style: AppTextStyles.moneyLg(t.txtPrimary).copyWith(fontSize: 34),
          ),
          const SizedBox(height: 16),
          Divider(
            height: 1,
            thickness: 1,
            color: t.divider.withValues(alpha: t.isDark ? 0.4 : 0.6),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _NetWorthStat(
                label: 'Included',
                count: includedCount,
                icon: LucideIcons.checkCircle,
                color: t.success,
              ),
              Container(
                width: 1,
                height: 32,
                color: t.divider.withValues(alpha: t.isDark ? 0.4 : 0.6),
              ),
              _NetWorthStat(
                label: 'Excluded',
                count: excludedCount,
                icon: LucideIcons.minusCircle,
                color: t.txtTertiary,
              ),
              Container(
                width: 1,
                height: 32,
                color: t.divider.withValues(alpha: t.isDark ? 0.4 : 0.6),
              ),
              _NetWorthStat(
                label: 'Total',
                count: totalCount,
                icon: LucideIcons.wallet,
                color: t.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NetWorthStat extends StatelessWidget {
  final String label;
  final int count;
  final IconData icon;
  final Color color;

  const _NetWorthStat({
    required this.label,
    required this.count,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 4),
          Text(
            '$count',
            style: AppTextStyles.h3(t.txtPrimary).copyWith(fontSize: 16),
          ),
          Text(
            label,
            style: AppTextStyles.caption(t.txtTertiary),
          ),
        ],
      ),
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
            Text('My Accounts', style: AppTextStyles.h3(t.txtPrimary)),
            const Spacer(),
            Text(
              '${accounts.length} accounts',
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
    final isNegative = account.balanceCents < 0;
    final balanceColor = isNegative ? t.error : t.txtPrimary;

    return GestureDetector(
      onTap: () => context.push('/accounts/${account.id}/edit'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: t.isDark
              ? const Color(0xFF1C1830).withValues(alpha: 0.72)
              : Colors.white.withValues(alpha: 0.9),
          borderRadius: AppRadius.xlAll,
          border: Border.all(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.07)
                : const Color(0xFF7C3AED).withValues(alpha: 0.12),
          ),
          boxShadow: t.isDark ? [] : AppShadows.cardLight,
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: t.primary.withValues(alpha: 0.15),
                borderRadius: AppRadius.lgAll,
              ),
              child: Icon(LucideIcons.wallet, color: t.primary, size: 22),
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
                        _Badge(label: 'Default', color: t.primary),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  formatCurrency(account.balanceCents),
                  style: AppTextStyles.moneyMd(balanceColor)
                      .copyWith(fontSize: 15),
                ),
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

class _Badge extends StatelessWidget {
  final String label;
  final Color color;

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: AppRadius.pillAll,
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 0.8,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
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
            'Failed to load accounts',
            style: AppTextStyles.body(t.txtSecondary),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
