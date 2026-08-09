import 'package:flutter/material.dart';

import '../../core/theme/app_motion.dart';

/// Fades and lifts a widget into place once, on mount. The mobile counterpart
/// of the web's `.anim-rise` class — panels, cards and chart blocks arrive
/// instead of appearing.
///
/// Use [index] to cascade siblings in a column or grid:
///
///     for (final (i, card) in cards.indexed)
///       FadeSlideIn(index: i, child: card),
class FadeSlideIn extends StatefulWidget {
  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.offset = 10,
    this.duration,
  });

  final Widget child;

  /// Position among siblings — each step adds one [AppMotion.stagger] of delay.
  final int index;

  /// How far below its resting place the widget starts, in logical pixels.
  final double offset;

  /// Defaults to [AppMotion.slow].
  final Duration? duration;

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: widget.duration ?? AppMotion.slow,
  );

  late final Animation<double> _t = CurvedAnimation(
    parent: _controller,
    curve: AppMotion.settle,
  );

  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;

    if (AppMotion.reduced(context)) {
      _controller.value = 1;
      return;
    }
    final delay = AppMotion.stagger * widget.index;
    if (delay == Duration.zero) {
      _controller.forward();
    } else {
      Future<void>.delayed(delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      child: widget.child,
      builder: (context, child) => Opacity(
        opacity: _t.value,
        child: Transform.translate(
          offset: Offset(0, widget.offset * (1 - _t.value)),
          child: child,
        ),
      ),
    );
  }
}
