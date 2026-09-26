import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_fab.dart';
import '../providers/insight_provider.dart';
import 'assistant_sheet.dart';

/// The single floating button of the shell. Tapping it opens upwards with two
/// options — create the page's item or open the AI assistant.
///
/// It degrades to the plain "+" when the platform has the AI switched off, and
/// to a direct assistant button on pages that have nothing to create (Menu,
/// Profile), so there is never a menu with a single entry.
class AssistantSpeedDial extends ConsumerStatefulWidget {
  const AssistantSpeedDial({
    super.key,
    required this.createLabel,
    required this.onCreate,
  });

  /// "Novo lançamento", "Nova conta"... Null when the page creates nothing.
  final String? createLabel;
  final VoidCallback? onCreate;

  @override
  ConsumerState<AssistantSpeedDial> createState() => _AssistantSpeedDialState();
}

class _AssistantSpeedDialState extends ConsumerState<AssistantSpeedDial> {
  bool _open = false;

  @override
  void didUpdateWidget(covariant AssistantSpeedDial oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Switching tabs changes what "+" creates; never carry an open menu over.
    if (oldWidget.createLabel != widget.createLabel) _open = false;
  }

  void _close() {
    if (_open) setState(() => _open = false);
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(aiSettingsProvider).valueOrNull;
    final aiAvailable = settings == null || settings.isAvailable;
    final canCreate = widget.onCreate != null;

    if (!aiAvailable) {
      return canCreate ? AppFAB(onTap: widget.onCreate) : const SizedBox.shrink();
    }

    if (!canCreate) {
      return _MainButton(
        icon: LucideIcons.sparkles,
        label: 'Abrir assistente',
        onTap: () => openAssistant(context, ref),
      );
    }

    return TapRegion(
      onTapOutside: (_) => _close(),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 160),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SizeTransition(sizeFactor: animation, axisAlignment: 1, child: child),
            ),
            child: _open
                ? Padding(
                    key: const ValueKey('options'),
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _Option(
                          icon: LucideIcons.sparkles,
                          label: 'Chat com IA',
                          onTap: () {
                            _close();
                            openAssistant(context, ref);
                          },
                        ),
                        const SizedBox(height: 10),
                        _Option(
                          icon: LucideIcons.plus,
                          label: widget.createLabel ?? 'Criar',
                          onTap: () {
                            _close();
                            widget.onCreate!();
                          },
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('closed')),
          ),
          _MainButton(
            icon: _open ? LucideIcons.x : LucideIcons.plus,
            label: _open ? 'Fechar opções' : 'Abrir opções',
            onTap: () => setState(() => _open = !_open),
          ),
        ],
      ),
    );
  }
}

class _MainButton extends StatelessWidget {
  const _MainButton({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 56,
          height: 56,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 160),
            child: Icon(icon, key: ValueKey(icon), color: Colors.white, size: 24),
          ),
        ),
      ),
    );
  }
}

/// One entry of the open menu: a labelled pill beside a small round icon.
class _Option extends StatelessWidget {
  const _Option({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final shadow = t.isDark ? AppShadows.cardDark : AppShadows.cardMd;

    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: t.surface,
                borderRadius: BorderRadius.circular(12),
                boxShadow: shadow,
              ),
              child: Text(
                label,
                style: AppTextStyles.bodySm(t.txtPrimary).copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: t.surface,
                border: Border.all(color: t.accent.withValues(alpha: 0.35)),
                boxShadow: shadow,
              ),
              child: Icon(icon, size: 20, color: t.accent),
            ),
          ],
        ),
      ),
    );
  }
}
