import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../../../shared/widgets/animated_fraction.dart';
import '../../providers/analytics_provider.dart';

class CategoryProjectionChart extends ConsumerWidget {
  const CategoryProjectionChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(categoryProjectionProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (items) {
        if (items.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);
        final display = compact ? items.take(5).toList() : items;

        return Column(
          children: display.map((item) {
            final ratio = item.historicalMonthlyAvg > 0
                ? (item.spentSoFar / item.historicalMonthlyAvg).clamp(0.0, 1.5)
                : 0.0;
            final isOver = item.spentSoFar > item.historicalMonthlyAvg;
            final barColor = isOver ? t.clay : t.primary;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.categoryName,
                          style: AppTextStyles.bodySm(t.txtPrimary)
                              .copyWith(fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${fmt.formatCurrency(item.spentSoFar)} / ${fmt.formatCurrency(item.historicalMonthlyAvg.toInt())}',
                        style: AppTextStyles.mono(t.txtTertiary, fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Stack(
                    children: [
                      // Background track
                      Container(
                        height: 8,
                        decoration: BoxDecoration(
                          color: t.surfaceEl,
                          borderRadius: AppRadius.pillAll,
                        ),
                      ),
                      // Month elapsed indicator
                      AnimatedFraction(
                        widthFactor:
                            (item.monthElapsedPercent / 100).clamp(0.0, 1.0),
                        child: Container(
                          height: 8,
                          decoration: BoxDecoration(
                            color: t.txtDisabled.withValues(alpha: 0.3),
                            borderRadius: AppRadius.pillAll,
                          ),
                        ),
                      ),
                      // Spent bar
                      AnimatedFraction(
                        widthFactor: ratio.clamp(0.0, 1.0),
                        child: Container(
                          height: 8,
                          decoration: BoxDecoration(
                            color: barColor,
                            borderRadius: AppRadius.pillAll,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (!compact) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          isOver
                              ? 'Acima em ${fmt.formatCurrency(item.spentSoFar - item.historicalMonthlyAvg.toInt())}'
                              : 'Projetado: ${fmt.formatCurrency(item.projectedTotal)}',
                          style: AppTextStyles.caption(
                            isOver ? t.clay : t.txtTertiary,
                          ).copyWith(fontSize: 10),
                        ),
                        const Spacer(),
                        Text(
                          '${item.monthElapsedPercent.toStringAsFixed(0)}% do mês decorrido',
                          style: AppTextStyles.caption(t.txtTertiary)
                              .copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

Widget _loader(bool compact) =>
    SizedBox(height: compact ? 160 : 220, child: const Center(child: CircularProgressIndicator()));

Widget _err(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Não foi possível carregar os dados', style: AppTextStyles.bodySm(t.txtTertiary))));

Widget _empty(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Nenhum dado de categoria disponível', style: AppTextStyles.bodySm(t.txtTertiary))));
