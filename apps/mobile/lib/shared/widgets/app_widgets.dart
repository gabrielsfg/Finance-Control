import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_spacing.dart';
import '../../main.dart';

// ── AppBackground ─────────────────────────────────────────────────────────

class AppBackground extends StatelessWidget {
  final Widget child;
  final bool scrollable;

  const AppBackground({super.key, required this.child, this.scrollable = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      color: t.bg,
      child: Stack(
        children: [
          Positioned(
            top: -80, right: -60,
            child: Container(
              width: 260, height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF8B5CF6).withOpacity(t.isDark ? 0.22 : 0.14),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          Positioned(
            bottom: 100, left: -100,
            child: Container(
              width: 320, height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF6D28D9).withOpacity(t.isDark ? 0.10 : 0.08),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          scrollable
              ? SingleChildScrollView(child: child)
              : child,
        ],
      ),
    );
  }
}

// ── GlassCard ─────────────────────────────────────────────────────────────

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;

  const GlassCard({super.key, required this.child, this.padding, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: padding ?? AppSpacing.cardPadding,
      decoration: BoxDecoration(
        color: t.isDark
            ? const Color(0xFF1C1830).withOpacity(0.72)
            : Colors.white.withOpacity(0.82),
        borderRadius: borderRadius ?? AppRadius.xlAll,
        border: Border.all(
          color: t.isDark
              ? Colors.white.withOpacity(0.07)
              : const Color(0xFF7C3AED).withOpacity(0.13),
        ),
        boxShadow: t.isDark ? [] : AppShadows.cardLight,
      ),
      child: child,
    );
  }
}

// ── PrimaryButton ─────────────────────────────────────────────────────────

class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool small;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: small ? 40 : 48,
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: AppRadius.mdAll,
          boxShadow: AppShadows.primaryBtnShadow,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[icon!, const SizedBox(width: 6)],
            Text(
              label,
              style: TextStyle(
                fontSize: small ? 13 : 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── OutlineButton ─────────────────────────────────────────────────────────

class AppOutlineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool danger;
  final bool dashed;

  const AppOutlineButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.danger = false,
    this.dashed = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final borderColor = danger
        ? t.error
        : t.isDark
            ? const Color(0xFF8B5CF6).withOpacity(0.5)
            : const Color(0xFF7C3AED).withOpacity(0.4);
    final bgColor = danger
        ? t.error.withOpacity(t.isDark ? 0.0 : 0.04)
        : t.primary.withOpacity(t.isDark ? 0.0 : 0.04);

    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: AppRadius.mdAll,
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[icon!, const SizedBox(width: 6)],
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: danger ? t.error : t.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── AppInputField ─────────────────────────────────────────────────────────

class AppInputField extends StatefulWidget {
  final String? placeholder;
  final String? label;
  final Widget? rightIcon;
  final Widget? leftIcon;
  final String? errorText;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onSubmitted;

  const AppInputField({
    super.key,
    this.placeholder,
    this.label,
    this.rightIcon,
    this.leftIcon,
    this.errorText,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.onChanged,
    this.onSubmitted,
  });

  @override
  State<AppInputField> createState() => _AppInputFieldState();
}

class _AppInputFieldState extends State<AppInputField> {
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: AppTextStyles.caption(t.txtSecondary)
                .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 5),
        ],
        GestureDetector(
          onTap: () => _focusNode.requestFocus(),
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: t.isDark
                  ? const Color(0xFF1C1830).withValues(alpha: 0.85)
                  : const Color(0xFFEDE9FE).withValues(alpha: 0.5),
              borderRadius: AppRadius.mdAll,
              border: Border.all(
                color: hasError
                    ? t.error
                    : t.isDark
                        ? Colors.white.withValues(alpha: 0.09)
                        : const Color(0xFF7C3AED).withValues(alpha: 0.18),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                if (widget.leftIcon != null) ...[
                  const SizedBox(width: 10),
                  IconTheme(
                    data: IconThemeData(color: t.txtTertiary),
                    child: widget.leftIcon!,
                  ),
                  const SizedBox(width: 8),
                ] else
                  const SizedBox(width: 14),
                Expanded(
                  child: TextField(
                    focusNode: _focusNode,
                    controller: widget.controller,
                    obscureText: widget.obscureText,
                    keyboardType: widget.keyboardType,
                    textInputAction: widget.textInputAction,
                    textCapitalization: widget.textCapitalization,
                    onChanged: widget.onChanged,
                    onSubmitted:
                        widget.onSubmitted != null ? (_) => widget.onSubmitted!() : null,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: widget.placeholder,
                      hintStyle:
                          AppTextStyles.body(t.txtTertiary).copyWith(fontSize: 14),
                      // Strip all decoration inherited from the theme
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      focusedErrorBorder: InputBorder.none,
                      filled: false,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
                if (widget.rightIcon != null) ...[
                  const SizedBox(width: 8),
                  IconTheme(
                    data: IconThemeData(color: t.txtTertiary, size: 20),
                    child: widget.rightIcon!,
                  ),
                  const SizedBox(width: 12),
                ] else
                  const SizedBox(width: 14),
              ],
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(
            widget.errorText!,
            style: AppTextStyles.caption(t.error).copyWith(fontSize: 11),
          ),
        ],
      ],
    );
  }
}

// ── AppProgressBar ────────────────────────────────────────────────────────

class AppProgressBar extends StatelessWidget {
  final double percent; // 0.0 to 1.0
  final Color? color;

  const AppProgressBar({super.key, required this.percent, this.color});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final c = percent >= 1.0
        ? t.error
        : percent >= 0.8
            ? t.warning
            : (color ?? t.primary);
    return Container(
      height: 6,
      decoration: BoxDecoration(
        borderRadius: AppRadius.fullAll,
        color: t.isDark
            ? Colors.white.withOpacity(0.08)
            : const Color(0xFF7C3AED).withOpacity(0.1),
      ),
      child: FractionallySizedBox(
        alignment: Alignment.centerLeft,
        widthFactor: percent.clamp(0.0, 1.0),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: AppRadius.fullAll,
            color: c,
          ),
        ),
      ),
    );
  }
}

// ── AppChip ───────────────────────────────────────────────────────────────

class AppChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback? onTap;

  const AppChip({super.key, required this.label, this.active = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        height: 32,
        decoration: BoxDecoration(
          borderRadius: AppRadius.fullAll,
          color: active
              ? t.primary.withOpacity(t.isDark ? 0.25 : 0.12)
              : t.surfaceEl.withOpacity(t.isDark ? 0.8 : 0.7),
          border: Border.all(
            color: active
                ? t.primary.withOpacity(t.isDark ? 0.55 : 0.45)
                : t.isDark
                    ? Colors.white.withOpacity(0.08)
                    : t.primary.withOpacity(0.18),
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: AppTextStyles.caption(active ? t.accent : t.txtTertiary)
                .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ),
      ),
    );
  }
}

// ── AppFAB ────────────────────────────────────────────────────────────────

class AppFAB extends StatelessWidget {
  final VoidCallback? onTap;

  const AppFAB({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.primaryGradient,
          boxShadow: AppShadows.fabShadow,
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 24),
      ),
    );
  }
}

// ── AppNavBar ─────────────────────────────────────────────────────────────

class AppNavBar extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int>? onTap;

  const AppNavBar({super.key, this.activeIndex = 0, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    const tabs = [
      (Icons.home_outlined, Icons.home, 'Início'),
      (Icons.list_outlined, Icons.list, 'Extrato'),
      (Icons.pie_chart_outline, Icons.pie_chart, 'Budget'),
      (Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, 'Contas'),
      (Icons.person_outline, Icons.person, 'Perfil'),
    ];

    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: t.isDark
            ? const Color(0xFF110E1B).withOpacity(0.97)
            : const Color(0xFFF7F4FF).withOpacity(0.97),
        border: Border(
          top: BorderSide(
            color: t.isDark
                ? Colors.white.withOpacity(0.06)
                : const Color(0xFF7C3AED).withOpacity(0.12),
          ),
        ),
      ),
      child: Row(
        children: tabs.asMap().entries.map((e) {
          final i = e.key;
          final (iconOff, iconOn, label) = e.value;
          final isActive = i == activeIndex;
          return Expanded(
            child: GestureDetector(
              onTap: () => onTap?.call(i),
              behavior: HitTestBehavior.opaque,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 3,
                    width: isActive ? 32 : 0,
                    decoration: BoxDecoration(
                      color: t.primary,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(3),
                        bottomRight: Radius.circular(3),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Icon(isActive ? iconOn : iconOff,
                      size: 22,
                      color: isActive ? t.primary : t.txtDisabled),
                  const SizedBox(height: 3),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                      color: isActive ? t.primary : t.txtDisabled,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── AppLogo ───────────────────────────────────────────────────────────────

class AppLogo extends StatelessWidget {
  final double size;
  const AppLogo({super.key, this.size = 80});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.logoGradient,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withOpacity(0.18),
            blurRadius: 0, spreadRadius: 4,
          ),
          ...AppShadows.logoShadow,
        ],
      ),
      child: Icon(Icons.account_balance_wallet,
          color: Colors.white, size: size * 0.44),
    );
  }
}

// ── AppAvatar ─────────────────────────────────────────────────────────────

class AppAvatar extends StatelessWidget {
  final String initials;
  final double size;

  const AppAvatar({super.key, this.initials = 'FC', this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.primaryGradient,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withOpacity(0.3),
            blurRadius: 0, spreadRadius: 2.5,
          ),
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontSize: size * 0.34,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

// ── ThemeToggleButton ─────────────────────────────────────────────────────
// TODO: remove before production — temporary widget for visual testing

class ThemeToggleButton extends ConsumerWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == ThemeMode.dark ||
        (mode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);
    return GestureDetector(
      onTap: () => ref.read(themeModeProvider.notifier).state =
          isDark ? ThemeMode.light : ThemeMode.dark,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isDark
              ? Colors.white.withValues(alpha: 0.1)
              : Colors.black.withValues(alpha: 0.06),
        ),
        child: Icon(
          isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
          size: 18,
          color: isDark ? Colors.white70 : Colors.black54,
        ),
      ),
    );
  }
}