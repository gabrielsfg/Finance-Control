import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';

// ── Page ───────────────────────────────────────────────────────────────────
//
// Central hub listing every destination in the app, including the ones already
// reachable from the bottom navigation bar. Main tabs switch via `context.go`
// (so the bottom bar follows); secondary pages are pushed on top.

class MenuPage extends ConsumerWidget {
  const MenuPage({super.key});

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
              const PageHeader(eyebrow: 'NAVEGAR', title: 'Menu'),
              const SizedBox(height: 24),

              const _MenuGroup(
                title: 'Navegação',
                items: [
                  _MenuEntry(
                    icon: LucideIcons.layoutDashboard,
                    label: 'Início',
                    subtitle: 'Visão geral e resumo do período',
                    route: '/',
                    switchTab: true,
                  ),
                  _MenuEntry(
                    icon: LucideIcons.arrowLeftRight,
                    label: 'Extrato',
                    subtitle: 'Todas as transações',
                    route: '/transactions',
                    switchTab: true,
                  ),
                  _MenuEntry(
                    icon: LucideIcons.pieChart,
                    label: 'Orçamento',
                    subtitle: 'Planejamento por categoria',
                    route: '/budgets',
                    switchTab: true,
                  ),
                  _MenuEntry(
                    icon: LucideIcons.wallet,
                    label: 'Contas',
                    subtitle: 'Saldos e cartões',
                    route: '/accounts',
                    switchTab: true,
                  ),
                ],
              ),
              const SizedBox(height: 22),

              const _MenuGroup(
                title: 'Planejamento',
                items: [
                  _MenuEntry(
                    icon: LucideIcons.target,
                    label: 'Metas',
                    subtitle: 'Objetivos de poupança e investimento',
                    route: '/goals',
                  ),
                  _MenuEntry(
                    icon: LucideIcons.repeat,
                    label: 'Recorrências',
                    subtitle: 'Assinaturas e parcelamentos',
                    route: '/recurring',
                  ),
                  _MenuEntry(
                    icon: LucideIcons.barChart3,
                    label: 'Análises',
                    subtitle: 'Gráficos e projeções',
                    route: '/analytics',
                  ),
                ],
              ),
              const SizedBox(height: 22),

              const _MenuGroup(
                title: 'Investimentos',
                items: [
                  _MenuEntry(
                    icon: LucideIcons.trendingUp,
                    label: 'Carteira',
                    subtitle: 'Seus investimentos e rentabilidade',
                    route: '/investments',
                  ),
                  _MenuEntry(
                    icon: LucideIcons.candlestickChart,
                    label: 'Mercado',
                    subtitle: 'Cotações, rankings e indicadores',
                    route: '/market',
                  ),
                ],
              ),
              const SizedBox(height: 22),

              const _MenuGroup(
                title: 'Conta',
                items: [
                  _MenuEntry(
                    icon: LucideIcons.tag,
                    label: 'Categorias',
                    subtitle: 'Categorias e subcategorias',
                    route: '/categories',
                  ),
                  _MenuEntry(
                    icon: LucideIcons.user,
                    label: 'Perfil',
                    subtitle: 'Seus dados e segurança',
                    route: '/profile',
                  ),
                  _MenuEntry(
                    icon: LucideIcons.settings,
                    label: 'Preferências',
                    subtitle: 'Moeda, idioma e fuso horário',
                    route: '/profile/preferences',
                  ),
                ],
              ),

              SizedBox(height: bottomPad + 76 + 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Group ──────────────────────────────────────────────────────────────────

class _MenuGroup extends StatelessWidget {
  const _MenuGroup({required this.title, required this.items});

  final String title;
  final List<_MenuEntry> items;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: AppRadius.xlAll,
            border: Border.all(color: t.mist),
          ),
          child: Column(
            children: List.generate(items.length, (i) {
              final isLast = i == items.length - 1;
              return Column(
                children: [
                  _MenuTile(entry: items[i]),
                  if (!isLast)
                    Divider(
                      height: 1,
                      thickness: 1,
                      indent: 62,
                      color: t.divider.withValues(alpha: 0.4),
                    ),
                ],
              );
            }),
          ),
        ),
      ],
    );
  }
}

// ── Tile ───────────────────────────────────────────────────────────────────

class _MenuEntry {
  const _MenuEntry({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.route,
    this.switchTab = false,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final String route;

  /// When true the destination is a bottom-nav tab, so switch to it with
  /// `context.go` (replacing the stack) instead of pushing on top.
  final bool switchTab;
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.entry});

  final _MenuEntry entry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: () {
        if (entry.switchTab) {
          context.go(entry.route);
        } else {
          context.push(entry.route);
        }
      },
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: t.accent.withValues(alpha: 0.12),
                borderRadius: AppRadius.mdAll,
              ),
              child: Icon(entry.icon, size: 19, color: t.accent),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.label,
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    entry.subtitle,
                    style: AppTextStyles.bodySm(t.txtTertiary),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 18, color: t.txtTertiary),
          ],
        ),
      ),
    );
  }
}
