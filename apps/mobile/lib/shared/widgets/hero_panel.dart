import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import 'money.dart';

/// The single dark panel — the dramatic point of a screen (net worth + flow).
/// Dark in BOTH themes, so it reads text/values via the `panel*` tokens.
class HeroPanel extends StatelessWidget {
  const HeroPanel({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.fromLTRB(24, 26, 24, 24),
      decoration: BoxDecoration(
        // Flat, deliberately. A gradient here cannot be both subtle and smooth:
        // at this luminance the channels only span a handful of 8-bit values
        // (panel -> panel2 is R 18-26, G 32-48, B 30-44), so a damped ramp
        // traverses ~12 distinct colours over the panel height and quantises
        // into visible horizontal bands — softening it further makes the bands
        // wider, not smoother. A strong ramp is smooth but reads as an edge.
        // Solid fill is the only version where no colour shift is perceptible.
        color: t.panel,
        borderRadius: AppRadius.heroAll,
        border: Border.all(
          color: t.isDark ? t.mist : Colors.white.withValues(alpha: 0.05),
        ),
        boxShadow: AppShadows.cardMd,
      ),
      child: child,
    );
  }
}

/// The flow bar (signature viz): income vs. expenses as two gradient bars with
/// a "balance of the period" footer. Designed to live inside a [HeroPanel].
class FlowBar extends StatelessWidget {
  const FlowBar({
    super.key,
    required this.incomeCents,
    required this.expenseCents,
    this.title = 'Fluxo do mês',
    this.periodLabel,
    this.showNet = true,
  });

  /// Income in cents (positive). Expense in cents (positive magnitude).
  final int incomeCents;
  final int expenseCents;
  final String title;
  final String? periodLabel;

  /// Whether to render the "balance of the period" footer.
  final bool showNet;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final maxVal = [
      incomeCents,
      expenseCents,
    ].fold<int>(1, (m, v) => v > m ? v : m);
    final net = incomeCents - expenseCents;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(child: Text(title, style: AppTextStyles.h3(t.panelText))),
            if (periodLabel != null)
              Text(
                periodLabel!.toUpperCase(),
                style: AppTextStyles.eyebrow(t.panelMuted, fontSize: 10),
              ),
          ],
        ),
        const SizedBox(height: 18),
        _FlowRow(
          label: 'Entradas',
          cents: incomeCents,
          fraction: incomeCents / maxVal,
          dotColor: t.mossLift,
          gradient: [t.moss, t.mossLift],
        ),
        const SizedBox(height: 14),
        _FlowRow(
          label: 'Saídas',
          cents: expenseCents,
          fraction: expenseCents / maxVal,
          dotColor: t.clayLift,
          gradient: [t.clay, t.clayLift],
        ),
        if (showNet) ...[
          const SizedBox(height: 18),
          Container(
            margin: const EdgeInsets.only(top: 2),
            padding: const EdgeInsets.only(top: 16),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Saldo do período',
                    style: AppTextStyles.eyebrow(t.panelMuted),
                  ),
                ),
                Money(
                  net,
                  size: 22,
                  weight: FontWeight.w600,
                  color: net >= 0 ? t.mossLift : t.clayLift,
                  symbolColor: t.panelMuted,
                  animate: true,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _FlowRow extends StatelessWidget {
  const _FlowRow({
    required this.label,
    required this.cents,
    required this.fraction,
    required this.dotColor,
    required this.gradient,
  });

  final String label;
  final int cents;
  final double fraction;
  final Color dotColor;
  final List<Color> gradient;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              width: 9,
              height: 9,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: dotColor,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            Text(
              label,
              style: AppTextStyles.bodySm(
                t.panelText,
              ).copyWith(fontWeight: FontWeight.w500),
            ),
            const Spacer(),
            Money(
              cents,
              size: 14,
              color: t.panelText,
              symbolColor: t.panelMuted,
              animate: true,
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: Container(
            height: 13,
            color: Colors.white.withValues(alpha: 0.07),
            child: Align(
              alignment: Alignment.centerLeft,
              child: TweenAnimationBuilder<double>(
                // begin: 0 so the bar grows on mount, not just on change.
                tween: Tween(begin: 0, end: fraction.clamp(0.0, 1.0)),
                duration: AppMotion.duration(context, AppMotion.slow),
                curve: AppMotion.settle,
                builder: (_, widthFactor, _) => FractionallySizedBox(
                  widthFactor: widthFactor,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: gradient),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
