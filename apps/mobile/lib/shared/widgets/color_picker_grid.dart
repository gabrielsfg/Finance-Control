import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/category_palette.dart';
import '../../core/utils/color_hex.dart';

/// A grid of category color swatches. The selected swatch gets a ring.
class ColorPickerGrid extends StatelessWidget {
  const ColorPickerGrid({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  final String? selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: categoryPalette.map((hex) {
        final isSelected = selected?.toUpperCase() == hex.toUpperCase();
        final color = colorFromHex(hex, fallback: t.accent);
        return GestureDetector(
          onTap: () => onSelected(hex),
          behavior: HitTestBehavior.opaque,
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? t.txtPrimary : Colors.transparent,
                width: 2.5,
              ),
            ),
            child: isSelected
                ? const Icon(Icons.check_rounded, size: 18, color: Colors.white)
                : null,
          ),
        );
      }).toList(),
    );
  }
}
