import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_motion.dart';
import '../../core/utils/app_locale.dart';

/// The Quantia money signature. Every monetary value in the app renders through
/// this widget: IBM Plex Mono, tabular figures, with the currency symbol and
/// the centavos set smaller and dimmed so the integer reads as the hero.
///
/// Color rules (from DESIGN-SYSTEM.md §7):
///   negative → clay · positive & [signed] → moss · otherwise → foreground.
/// A negative value always shows a "−" and, when [signed], a positive shows "+".
///
/// Set [animate] to count the figure up from zero when it first appears and to
/// travel it to the new total whenever [cents] changes (applying a filter, for
/// instance). It is opt-in on purpose: it belongs on totalizadores and hero
/// figures, not on every row of a list.
class Money extends StatelessWidget {
  const Money(
    this.cents, {
    super.key,
    this.size = 15,
    this.weight = FontWeight.w500,
    this.color,
    this.signed = false,
    this.symbolColor,
    this.symbolOpacity = 0.7,
    this.symbolScale = 0.62,
    this.centsScale = 0.66,
    this.letterSpacing = -0.2,
    this.animate = false,
  });

  /// Amount in cents (int). Positive = income, negative = expense.
  final int cents;

  /// Font size of the integer part (the hero). Symbol/cents scale from this.
  final double size;
  final FontWeight weight;

  /// Explicit color for the integer; overrides the by-sign resolution.
  final Color? color;

  /// When true, positive values render moss + "+"; negatives always clay + "−".
  final bool signed;

  /// Color for the currency symbol + cents. Defaults to the main color dimmed.
  final Color? symbolColor;
  final double symbolOpacity;
  final double symbolScale;
  final double centsScale;
  final double letterSpacing;

  /// Count the figure up on first build and on every change of [cents].
  final bool animate;

  @override
  Widget build(BuildContext context) {
    if (!animate || AppMotion.reduced(context)) return _text(context, cents);

    // `begin: 0` is what makes the count-up happen at all. TweenAnimationBuilder
    // only calls `controller.forward()` in initState when `begin != end`, and a
    // null begin is filled in with `end` — so `Tween(end: x)` alone renders the
    // final figure with no animation. With begin set, mount counts 0 → value and
    // every later change tweens from wherever the digits currently are.
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: cents.toDouble()),
      duration: AppMotion.number,
      curve: AppMotion.settle,
      builder: (context, value, _) => _text(context, value.round()),
    );
  }

  Widget _text(BuildContext context, int shownCents) {
    final t = AppThemeTokens.of(context);
    final parts = AppLocaleScope.of(context).currencyParts(shownCents);
    // Sign and colour follow the *target*, never the in-flight value, so the
    // glyphs don't flip while the number is still travelling.
    final neg = cents < 0;

    final mainColor =
        color ?? (neg ? t.clay : (signed ? t.moss : t.txtPrimary));
    final dim = symbolColor ?? mainColor.withValues(alpha: symbolOpacity);

    final prefix = neg ? '− ' : (signed ? '+ ' : '');

    final base = GoogleFonts.ibmPlexMono(
      fontSize: size,
      fontWeight: weight,
      color: mainColor,
      letterSpacing: letterSpacing,
      height: 1.0,
    );

    return Text.rich(
      TextSpan(
        style: base,
        children: [
          TextSpan(
            text: '${parts.symbol}$prefix',
            style: TextStyle(
              fontSize: size * symbolScale,
              color: dim,
              fontWeight: FontWeight.w500,
            ),
          ),
          TextSpan(text: parts.integer),
          TextSpan(
            text: parts.decimal,
            style: TextStyle(fontSize: size * centsScale, color: dim),
          ),
        ],
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
