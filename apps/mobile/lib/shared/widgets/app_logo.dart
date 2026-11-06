import 'package:flutter/material.dart';

/// The Helmo helm (ship's wheel with the pie quarter). A raster placeholder cut
/// from the logo artwork until there is a vector version; `size` is its height.
class AppLogo extends StatelessWidget {
  final double size;
  const AppLogo({super.key, this.size = 80});

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/brand/helmo_mark.png',
      height: size,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      semanticLabel: 'Helmo',
    );
  }
}
