import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/ai_labels.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/ai_models.dart';
import '../providers/insight_provider.dart';
import 'ai_state_notice.dart';

/// The weekly analysis card — spending on the home, portfolio on investments.
/// Renders every availability state; [AiAvailability.unavailable] renders
/// nothing (the platform switched the AI off), including its spacing.
class AiInsightCard extends ConsumerWidget {
  const AiInsightCard({
    super.key,
    required this.kind,
    this.bottomSpacing = 0,
  });

  final AiInsightKind kind;

  /// Gap below the card, dropped together with it when there is nothing to show.
  final double bottomSpacing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(kind == AiInsightKind.spending
        ? spendingInsightProvider
        : portfolioInsightProvider);

    final Widget? content = async.when(
      loading: () => const _LoadingBody(),
      error: (_, _) => _ErrorBody(onRetry: () => _refresh(ref)),
      data: (result) => switch (result.status) {
        AiAvailability.unavailable => null,
        AiAvailability.available when result.insight != null =>
          _InsightBody(insight: result.insight!),
        AiAvailability.quotaExceeded when result.insight != null =>
          _InsightBody(insight: result.insight!, quotaReached: true),
        AiAvailability.available =>
          const AiStateNotice(status: AiAvailability.notEnoughData),
        _ => AiStateNotice(status: result.status),
      },
    );

    if (content == null) return const SizedBox.shrink();

    return Padding(
      padding: EdgeInsets.only(bottom: bottomSpacing),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CardHeader(kind: kind),
            const SizedBox(height: 12),
            content,
          ],
        ),
      ),
    );
  }

  void _refresh(WidgetRef ref) {
    if (kind == AiInsightKind.spending) {
      ref.read(spendingInsightProvider.notifier).refresh();
    } else {
      ref.read(portfolioInsightProvider.notifier).refresh();
    }
  }
}

class _CardHeader extends StatelessWidget {
  const _CardHeader({required this.kind});

  final AiInsightKind kind;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        Icon(LucideIcons.sparkles, size: 14, color: t.accent),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            kind == AiInsightKind.spending
                ? 'ANÁLISE DA SEMANA'
                : 'ANÁLISE DA CARTEIRA',
            style: AppTextStyles.eyebrow(t.txtSecondary),
          ),
        ),
      ],
    );
  }
}

class _InsightBody extends StatelessWidget {
  const _InsightBody({required this.insight, this.quotaReached = false});

  final AiInsight insight;
  final bool quotaReached;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (quotaReached) ...[
          TonalTag(aiQuotaExceededLabel, color: t.gold, fontSize: 10),
          const SizedBox(height: 10),
        ],
        if (insight.headline.isNotEmpty) ...[
          Text(insight.headline, style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 8),
        ],
        for (final paragraph in insight.paragraphs) ...[
          Text(paragraph, style: AppTextStyles.bodySm(t.txtSecondary)),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 2),
        Text(
          insight.generatedByAi
              ? 'Gerado por IA em ${fmt.formatDate(insight.generatedAt)} · pode conter imprecisões'
              : 'Resumo automático de ${fmt.formatDate(insight.generatedAt)}',
          style: AppTextStyles.caption(t.txtTertiary),
        ),
      ],
    );
  }
}

class _LoadingBody extends StatelessWidget {
  const _LoadingBody();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(strokeWidth: 2, color: t.accent),
        ),
        const SizedBox(width: 10),
        Text('Preparando a análise…',
            style: AppTextStyles.bodySm(t.txtTertiary)),
      ],
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        Expanded(
          child: Text(
            'Não foi possível carregar a análise.',
            style: AppTextStyles.bodySm(t.txtSecondary),
          ),
        ),
        GestureDetector(
          onTap: onRetry,
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xs),
            child: Text(
              'TENTAR DE NOVO',
              style: AppTextStyles.eyebrow(t.accent).copyWith(letterSpacing: 0.6),
            ),
          ),
        ),
      ],
    );
  }
}
