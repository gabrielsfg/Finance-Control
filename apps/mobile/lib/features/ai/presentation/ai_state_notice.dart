import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/ai_labels.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/ai_models.dart';

/// The Premium upsell for the AI features. Mobile has no checkout, so it only
/// explains what the plan unlocks.
class AiPremiumNotice extends StatelessWidget {
  const AiPremiumNotice({
    super.key,
    this.title = 'Recurso Premium',
    this.message =
        'Análises semanais e o assistente com IA fazem parte do plano Premium.',
    this.flat = false,
  });

  final String title;
  final String message;

  /// Drop the card chrome when the notice sits inside another surface.
  final bool flat;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final body = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: t.gold.withValues(alpha: 0.14),
            borderRadius: AppRadius.baseAll,
          ),
          child: Icon(LucideIcons.crown, size: 18, color: t.gold),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TonalTag('Premium', color: t.gold, fontSize: 10),
              const SizedBox(height: 8),
              Text(title, style: AppTextStyles.h3(t.txtPrimary)),
              const SizedBox(height: 4),
              Text(message, style: AppTextStyles.bodySm(t.txtSecondary)),
            ],
          ),
        ),
      ],
    );
    return flat ? body : GlassCard(child: body);
  }
}

/// A non-content state of an AI feature — switched off, unavailable, out of
/// quota, not enough data — as a quiet line with an icon, plus the way back to
/// the switch when the user turned the AI off.
class AiStateNotice extends StatelessWidget {
  const AiStateNotice({
    super.key,
    required this.status,
    this.quotaLabel = aiQuotaExceededLabel,
    this.onOpenSettings,
  });

  final AiAvailability status;

  /// Overrides the default jump to Perfil — a sheet closes itself first.
  final VoidCallback? onOpenSettings;

  /// The chat names the message count; the analyses just say the limit.
  final String quotaLabel;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    if (status == AiAvailability.notPremium) {
      return const AiPremiumNotice(flat: true);
    }

    final (IconData icon, String title, String? body, Color color) =
        switch (status) {
      AiAvailability.aiDisabled => (
          LucideIcons.powerOff,
          aiDisabledTitle,
          aiDisabledBody,
          t.txtSecondary,
        ),
      AiAvailability.quotaExceeded => (
          LucideIcons.gauge,
          quotaLabel,
          'O limite renova no início do próximo mês.',
          t.gold,
        ),
      AiAvailability.notEnoughData => (
          LucideIcons.hourglass,
          aiNotEnoughDataLabel,
          null,
          t.txtSecondary,
        ),
      _ => (LucideIcons.cloudOff, aiUnavailableLabel, null, t.txtTertiary),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (body != null) ...[
                    const SizedBox(height: 2),
                    Text(body, style: AppTextStyles.bodySm(t.txtSecondary)),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (status == AiAvailability.aiDisabled) ...[
          const SizedBox(height: 12),
          GestureDetector(
            onTap: onOpenSettings ?? () => context.go('/profile'),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.only(left: 28),
              child: Text(
                'Abrir IA no Quantia →',
                style: AppTextStyles.eyebrow(t.accent)
                    .copyWith(letterSpacing: 0.4),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
