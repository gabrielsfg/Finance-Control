import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';

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
              const _PreferencesSection(),
              const SizedBox(height: 16),
              const _AccountSection(),
              const SizedBox(height: 16),
              const _SupportSection(),
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

    return Row(
      children: [
        Expanded(
          child: Text('Profile', style: AppTextStyles.h1(t.txtPrimary)),
        ),
        const ThemeToggleButton(),
      ],
    );
  }
}

// ── Profile Card ───────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  const _ProfileCard();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GlassCard(
      child: Row(
        children: [
          const AppAvatar(initials: '?', size: 56),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '—',
                  style: AppTextStyles.h3(t.txtPrimary),
                ),
                const SizedBox(height: 3),
                Text(
                  '—',
                  style: AppTextStyles.bodySm(t.txtTertiary),
                ),
                const SizedBox(height: 4),
                Text(
                  '',
                  style: AppTextStyles.caption(t.txtDisabled),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              // TODO: navigate to edit profile
            },
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: t.primary.withValues(alpha: t.isDark ? 0.15 : 0.1),
                border: Border.all(
                  color: t.primary.withValues(alpha: 0.25),
                  width: 1,
                ),
              ),
              child: Icon(
                LucideIcons.pencil,
                size: 15,
                color: t.primary,
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
        style: AppTextStyles.caption(t.txtTertiary).copyWith(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.0,
        ),
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

    return Container(
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
                  color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.6),
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

// ── Preferences Section ────────────────────────────────────────────────────

class _PreferencesSection extends StatelessWidget {
  const _PreferencesSection();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Preferences'),
        _SettingsCard(
          items: [
            _SettingRow(
              icon: LucideIcons.bell,
              iconColor: t.primary,
              label: 'Notifications',
              subtitle: 'Reminders and alerts',
              onTap: () {
                // TODO: navigate to notifications settings
              },
            ),
            _SettingRow(
              icon: LucideIcons.globe,
              iconColor: const Color(0xFF06B6D4),
              label: 'Language',
              trailingLabel: 'Português',
              onTap: () {
                // TODO: navigate to language settings
              },
            ),
            _SettingRow(
              icon: LucideIcons.dollarSign,
              iconColor: const Color(0xFF22C55E),
              label: 'Currency',
              trailingLabel: 'BRL',
              onTap: () {
                // TODO: navigate to currency settings
              },
            ),
          ],
        ),
      ],
    );
  }
}

// ── Account Section ────────────────────────────────────────────────────────

class _AccountSection extends StatelessWidget {
  const _AccountSection();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Account'),
        _SettingsCard(
          items: [
            _SettingRow(
              icon: LucideIcons.tag,
              iconColor: const Color(0xFF8B5CF6),
              label: 'Categorias',
              subtitle: 'Gerencie suas categorias',
              onTap: () => context.push('/categories'),
            ),
            _SettingRow(
              icon: LucideIcons.user,
              iconColor: t.primary,
              label: 'Edit Profile',
              subtitle: 'Name, email, and password',
              onTap: () {
                // TODO: navigate to edit profile
              },
            ),
            _SettingRow(
              icon: LucideIcons.shieldCheck,
              iconColor: const Color(0xFF06B6D4),
              label: 'Security',
              subtitle: 'PIN and biometrics',
              onTap: () {
                // TODO: navigate to security settings
              },
            ),
            _SettingRow(
              icon: LucideIcons.download,
              iconColor: const Color(0xFFF59E0B),
              label: 'Export Data',
              subtitle: 'Download your transactions',
              onTap: () {
                // TODO: export data
              },
            ),
          ],
        ),
      ],
    );
  }
}

// ── Support Section ────────────────────────────────────────────────────────

class _SupportSection extends StatelessWidget {
  const _SupportSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionHeader(title: 'Support'),
        _SettingsCard(
          items: [
            _SettingRow(
              icon: LucideIcons.helpCircle,
              iconColor: const Color(0xFF8B5CF6),
              label: 'Help Center',
              onTap: () {
                // TODO: open help center
              },
            ),
            _SettingRow(
              icon: LucideIcons.messageCircle,
              iconColor: const Color(0xFF22C55E),
              label: 'Send Feedback',
              onTap: () {
                // TODO: open feedback form
              },
            ),
            _SettingRow(
              icon: LucideIcons.star,
              iconColor: const Color(0xFFF59E0B),
              label: 'Rate the App',
              onTap: () {
                // TODO: open app store rating
              },
            ),
          ],
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
      onTap: () {
        // TODO: call ref.read(authNotifierProvider.notifier).logout()
        // after auth is wired up
      },
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
              'Log Out',
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
