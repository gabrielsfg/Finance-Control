import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/app_locale.dart';

/// The Quantia money signature. Every monetary value in the app renders through
/// this widget: IBM Plex Mono, tabular figures, with the currency symbol and
/// the centavos set smaller and dimmed so the integer reads as the hero.
///
/// Color rules (from DESIGN-SYSTEM.md §7):
///   negative → clay · positive & [signed] → moss · otherwise → foreground.
/// A negative value always shows a "−" and, when [signed], a positive shows "+".
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

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final parts = AppLocaleScope.of(context).currencyParts(cents);
    final neg = parts.negative;

    final mainColor = color ??
        (neg ? t.clay : (signed ? t.moss : t.txtPrimary));
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
