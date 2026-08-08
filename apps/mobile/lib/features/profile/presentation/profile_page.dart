import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/providers/auth_provider.dart';
import '../../budgets/providers/budget_provider.dart';
import '../../home/providers/home_provider.dart';
import '../../transactions/providers/picker_providers.dart';
import '../../transactions/providers/transaction_feed_provider.dart';
import '../providers/user_preferences_provider.dart';
import '../providers/user_provider.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
              const SizedBox(height: 28),
              const _ProfileCard(),
              const SizedBox(height: 24),
              const _PlanningSection(),
              const SizedBox(height: 16),
              const _PreferencesSection(),
              const SizedBox(height: 16),
              const _AccountSection(),
              const SizedBox(height: 24),
              const _LogoutButton(),
              const SizedBox(height: 12),
              const _AppVersion(),
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

    return Text('Perfil', style: AppTextStyles.h1(t.txtPrimary));
  }
}

// ── Profile Card ───────────────────────────────────────────────────────────

class _ProfileCard extends ConsumerWidget {
  const _ProfileCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final profileAsync = ref.watch(userProfileProvider);

    final name = profileAsync.valueOrNull?.name ?? '—';
    final email = profileAsync.valueOrNull?.email ?? '—';
    final initials = name != '—' && name.isNotEmpty
        ? name.trim().split(' ').map((w) => w[0]).take(2).join().toUpperCase()
        : '?';

    return GlassCard(
      child: Row(
        children: [
          AppAvatar(initials: initials, size: 56),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: AppTextStyles.h3(t.txtPrimary),
                ),
                const SizedBox(height: 3),
                Text(
                  email,
                  style: AppTextStyles.bodySm(t.txtTertiary),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => context.push('/profile/edit'),
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: t.accent.withValues(alpha: t.isDark ? 0.15 : 0.1),
                border: Border.all(
                  color: t.accent.withValues(alpha: 0.25),
                  width: 1,
                ),
              ),
              child: Icon(
                LucideIcons.pencil,
                size: 15,
                color: t.accent,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section Header ─────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 10),
      child: Text(
        title.toUpperCase(),
        style: AppTextStyles.eyebrow(t.txtSecondary),
      ),
    );
  }
}

// ── Settings Group Card ────────────────────────────────────────────────────

class _SettingsCard extends StatelessWidget {
  final List<_SettingRow> items;
  const _SettingsCard({required this.items});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GlassCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: List.generate(items.length, (i) {
          final item = items[i];
          final isLast = i == items.length - 1;
          return Column(
            children: [
              _SettingRowWidget(data: item),
              if (!isLast)
                Divider(
                  height: 1,
                  thickness: 1,
                  indent: 54,
                  color: t.mist,
                ),
            ],
          );
        }),
      ),
    );
  }
}

class _SettingRow {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String? subtitle;
  final String? trailingLabel;
  final VoidCallback? onTap;

  const _SettingRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    this.subtitle,
    this.trailingLabel,
    this.onTap,
  });
}

class _SettingRowWidget extends StatelessWidget {
  final _SettingRow data;
  const _SettingRowWidget({required this.data});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: data.onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: data.iconColor.withValues(alpha: 0.13),
                borderRadius: AppRadius.mdAll,
              ),
              child: Icon(data.icon, size: 17, color: data.iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    data.label,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  if (data.subtitle != null) ...[
                    const SizedBox(height: 1),
                    Text(
                      data.subtitle!,
                      style: AppTextStyles.caption(t.txtTertiary),
                    ),
                  ],
                ],
              ),
            ),
            if (data.trailingLabel != null) ...[
              Text(
                data.trailingLabel!,
                style: AppTextStyles.bodySm(t.txtTertiary),
              ),
              const SizedBox(width: 4),
            ],
            Icon(LucideIcons.chevronRight, size: 16, color: t.txtDisabled),
          ],
        ),
      ),
    );
  }
}

// ── Planning Section ───────────────────────────────────────────────────────

class _PlanningSection extends StatelessWidget {
  const _PlanningSection();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Planejar'),
        _SettingsCard(
          items: [
            _SettingRow(
              icon: LucideIcons.target,
              iconColor: t.accent,
              label: 'Metas',
              subtitle: 'Acompanhe seus objetivos',
              onTap: () => context.push('/goals'),
            ),
            _SettingRow(
              icon: LucideIcons.repeat,
              iconColor: t.accent,
              label: 'Recorrências',
              subtitle: 'Assinaturas e parcelas',
              onTap: () => context.push('/recurring'),
            ),
            _SettingRow(
              icon: LucideIcons.lineChart,
              iconColor: t.accent,
              label: 'Análises',
              subtitle: 'Gráficos e tendências',
              onTap: () => context.push('/analytics'),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Preferences Section ────────────────────────────────────────────────────

class _PreferencesSection extends ConsumerWidget {
  const _PreferencesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final prefs = ref.watch(userPreferencesProvider).valueOrNull;

    final currencyLabel = prefs?.currencyCode ?? 'BRL';
    final localeLabel = prefs?.locale == 'en-US' ? 'English' : 'Português';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Preferências'),
        _SettingsCard(
          items: [
            _SettingRow(
              icon: LucideIcons.settings,
              iconColor: t.accent,
              label: 'Preferências',
              trailingLabel: '$currencyLabel · $localeLabel',
              onTap: () => context.push('/profile/preferences'),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Account Section ────────────────────────────────────────────────────────

class _AccountSection extends ConsumerWidget {
  const _AccountSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Conta'),
        _SettingsCard(
          items: [
            _SettingRow(
              icon: LucideIcons.tag,
              iconColor: t.accent,
              label: 'Categorias',
              subtitle: 'Gerencie suas categorias',
              onTap: () => context.push('/categories'),
            ),
            _SettingRow(
              icon: LucideIcons.user,
              iconColor: t.accent,
              label: 'Editar perfil',
              subtitle: 'Nome e e-mail',
              onTap: () => context.push('/profile/edit'),
            ),
            _SettingRow(
              icon: LucideIcons.rotateCcw,
              iconColor: t.gold,
              label: 'Zerar dados',
              subtitle: 'Apaga todos os registros financeiros',
              onTap: () => _showResetDataDialog(context, ref),
            ),
            _SettingRow(
              icon: LucideIcons.userX,
              iconColor: t.error,
              label: 'Excluir conta',
              subtitle: 'Remove sua conta permanentemente',
              onTap: () => _showDeleteAccountDialog(context, ref),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _showResetDataDialog(BuildContext context, WidgetRef ref) async {
    await showDialog<void>(
      context: context,
      builder: (_) => _PasswordConfirmDialog(
        title: 'Zerar dados',
        warning:
            'Isso vai excluir permanentemente todas as suas transações, contas, orçamentos e categorias. Sua conta será mantida.',
        confirmLabel: 'Zerar',
        isDestructive: true,
        onConfirm: (password) async {
          await ref.read(authRepositoryProvider).resetData(password);
          ref.invalidate(categoriesProvider);
          ref.invalidate(accountsNotifierProvider);
          ref.invalidate(transactionFeedProvider);
          ref.invalidate(homeNotifierProvider);
          ref.invalidate(budgetNotifierProvider);
        },
      ),
    );
  }

  Future<void> _showDeleteAccountDialog(BuildContext context, WidgetRef ref) async {
    await showDialog<void>(
      context: context,
      builder: (_) => _PasswordConfirmDialog(
        title: 'Excluir conta',
        warning:
            'Isso vai excluir permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.',
        confirmLabel: 'Excluir',
        isDestructive: true,
        onConfirm: (password) async {
          await ref.read(authRepositoryProvider).deleteAccount(password);
          await ref.read(authNotifierProvider.notifier).logout();
        },
      ),
    );
  }
}

// ── Password Confirm Dialog ────────────────────────────────────────────────

class _PasswordConfirmDialog extends StatefulWidget {
  const _PasswordConfirmDialog({
    required this.title,
    required this.warning,
    required this.confirmLabel,
    required this.isDestructive,
    required this.onConfirm,
  });

  final String title;
  final String warning;
  final String confirmLabel;
  final bool isDestructive;
  final Future<void> Function(String password) onConfirm;

  @override
  State<_PasswordConfirmDialog> createState() => _PasswordConfirmDialogState();
}

class _PasswordConfirmDialogState extends State<_PasswordConfirmDialog> {
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final password = _controller.text.trim();
    if (password.isEmpty) {
      setState(() => _error = 'Informe a senha.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.onConfirm(password);
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Senha inválida.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final confirmColor = widget.isDestructive ? t.error : t.primary;

    return AlertDialog(
      title: Text(widget.title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.warning, style: AppTextStyles.bodySm(t.txtSecondary)),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            obscureText: true,
            autofocus: true,
            decoration: InputDecoration(
              labelText: 'Senha',
              errorText: _error,
            ),
            onSubmitted: (_) => _submit(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        TextButton(
          onPressed: _loading ? null : _submit,
          child: _loading
              ? SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: confirmColor,
                  ),
                )
              : Text(
                  widget.confirmLabel,
                  style: TextStyle(color: confirmColor),
                ),
        ),
      ],
    );
  }
}

// ── Logout Button ──────────────────────────────────────────────────────────

class _LogoutButton extends ConsumerWidget {
  const _LogoutButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: () => ref.read(authNotifierProvider.notifier).logout(),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: t.error.withValues(alpha: t.isDark ? 0.1 : 0.06),
          borderRadius: AppRadius.baseAll,
          border: Border.all(
            color: t.error.withValues(alpha: t.isDark ? 0.35 : 0.3),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.logOut, size: 18, color: t.error),
            const SizedBox(width: 8),
            Text(
              'Sair',
              style: AppTextStyles.body(t.error).copyWith(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── App Version ────────────────────────────────────────────────────────────

class _AppVersion extends StatelessWidget {
  const _AppVersion();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Center(
      child: Text(
        'FinanceControl v1.0.0',
        style: AppTextStyles.caption(t.txtDisabled),
      ),
    );
  }
}
