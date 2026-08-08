/**
 * One motion vocabulary for every Recharts series in the app.
 *
 * Recharts animates both the mount (bars growing from the baseline, lines
 * drawing, pie sectors sweeping) and every data swap (a filter change moves the
 * bars to their new height). All we own here is the timing, so a chart on the
 * dashboard and a chart in Análises feel like the same product.
 *
 * Import and spread on the series element:
 *
 *   <Bar dataKey="total" {...chartAnim()} />
 *   <Area dataKey="Receitas" {...chartAnim(0)} />
 *   <Area dataKey="Despesas" {...chartAnim(1)} />
 */

/** Fast — the whole reveal is over before it can feel like waiting. */
export const CHART_ANIM_DURATION = 620;

/** Delay between stacked/overlaid series so they cascade instead of clumping. */
export const CHART_ANIM_STAGGER = 90;

export const CHART_ANIM_EASING = "ease-out" as const;

type ChartAnimProps = {
  isAnimationActive: boolean;
  animationDuration: number;
  animationBegin: number;
  animationEasing: typeof CHART_ANIM_EASING;
};

/**
 * @param seriesIndex Position of this series inside the chart — used to stagger
 *                    the reveal. Pass nothing for single-series charts.
 * @param duration    Override the default length (e.g. longer for a big pie).
 */
export function chartAnim(seriesIndex = 0, duration = CHART_ANIM_DURATION): ChartAnimProps {
  return {
    isAnimationActive: true,
    animationDuration: duration,
    animationBegin: seriesIndex * CHART_ANIM_STAGGER,
    animationEasing: CHART_ANIM_EASING,
  };
}

/**
 * Pie/donut charts read better with a slightly longer sweep — the arc has more
 * distance to cover than a bar has height.
 */
export function pieAnim(duration = 760): ChartAnimProps {
  return {
    isAnimationActive: true,
    animationDuration: duration,
    animationBegin: 0,
    animationEasing: CHART_ANIM_EASING,
  };
}
