import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/app_motion.dart';

/// How a chart arrives on screen.
enum ChartRevealMode {
  /// Grows up from the baseline — bar charts and stacked areas.
  grow,

  /// Draws in from the left — line charts, so the series reads as travelling.
  draw,

  /// Sweeps clockwise from 12 o'clock until the ring is closed — pie/donut.
  sweep,

  /// Scales up softly from the centre — heatmaps, gauges, anything without a
  /// natural direction.
  pop,
}

/// Reveals a chart on mount, once.
///
/// This is deliberately a *presentation* wrapper rather than something that
/// interpolates the data: fl_chart already animates every data swap (see
/// `swapAnimationDuration` on each chart), but it paints its **first** frame
/// fully drawn. Wrapping gives the missing entrance without a second animation
/// fighting the swap one — the wrapper runs once and then gets out of the way.
///
///     ChartReveal(
///       mode: ChartRevealMode.grow,
///       child: SizedBox(height: 220, child: BarChart(...)),
///     )
class ChartReveal extends StatefulWidget {
  const ChartReveal({
    super.key,
    required this.child,
    this.mode = ChartRevealMode.grow,
    this.duration,
    this.delay = Duration.zero,
  });

  final Widget child;
  final ChartRevealMode mode;

  /// Defaults to [AppMotion.slow].
  final Duration? duration;

  /// Hold before starting — used to stagger several charts on one screen.
  final Duration delay;

  @override
  State<ChartReveal> createState() => _ChartRevealState();
}

class _ChartRevealState extends State<ChartReveal>
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
    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      Future<void>.delayed(widget.delay, () {
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
      builder: (context, child) {
        final t = _t.value;
        switch (widget.mode) {
          case ChartRevealMode.grow:
            return Opacity(
              opacity: t,
              child: ClipRect(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  // Never fully collapse: a 0-height box would drop fl_chart's
                  // layout constraints and make it repaint from scratch.
                  heightFactor: math.max(t, 0.001),
                  child: child,
                ),
              ),
            );
          case ChartRevealMode.draw:
            return Opacity(
              opacity: math.min(1, t * 2),
              child: ClipRect(
                child: Align(
                  alignment: Alignment.centerLeft,
                  widthFactor: math.max(t, 0.001),
                  child: child,
                ),
              ),
            );
          case ChartRevealMode.sweep:
            return Opacity(
              opacity: math.min(1, t * 1.6),
              child: ClipPath(clipper: _SweepClipper(t), child: child),
            );
          case ChartRevealMode.pop:
            return Opacity(
              opacity: t,
              child: Transform.scale(scale: 0.92 + 0.08 * t, child: child),
            );
        }
      },
    );
  }
}

/// Clips to a pie slice that opens clockwise from 12 o'clock, so a donut chart
/// fills itself in the direction its own sectors are laid out.
class _SweepClipper extends CustomClipper<Path> {
  const _SweepClipper(this.t);

  final double t;

  @override
  Path getClip(Size size) {
    if (t >= 1) {
      return Path()..addRect(Offset.zero & size);
    }
    final center = size.center(Offset.zero);
    // Corner distance, so the wedge always covers the full box.
    final radius = size.width + size.height;
    return Path()
      ..moveTo(center.dx, center.dy)
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * t,
        false,
      )
      ..close();
  }

  @override
  bool shouldReclip(_SweepClipper oldClipper) => oldClipper.t != t;
}
