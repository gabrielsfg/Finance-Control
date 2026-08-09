import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

/// A curated set of native emoji, grouped for a finance app. Stored/sent as the
/// raw native unicode character (same representation the web app uses).
const _emojis = <String>[
  '💰', '💵', '💳', '🏦', '📈', '📉', '💸', '🪙', '💹', '🧾',
  '🏠', '🏡', '🛋️', '🔌', '💡', '🚰', '🧹', '🛠️', '🪑', '🚿',
  '🍔', '🍕', '🍜', '☕', '🍺', '🛒', '🥦', '🍎', '🍫', '🍞',
  '🚗', '⛽', '🚌', '🚕', '✈️', '🚲', '🛵', '🅿️', '🚙', '🛣️',
  '🏥', '💊', '🩺', '🦷', '🏋️', '🧘', '💉', '🩹', '👓', '🧴',
  '🎬', '🎮', '🎵', '🎧', '📚', '🎸', '🎨', '🎟️', '🍿', '🎳',
  '👕', '👗', '👟', '💄', '💇', '🎁', '💍', '🕶️', '🧢', '👜',
  '📱', '💻', '🖥️', '⌚', '📷', '🎓', '🐶', '🐱', '✈️', '🏖️',
];

/// Shows a bottom sheet to pick an emoji; returns the chosen native emoji.
Future<String?> showEmojiPickerSheet(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => const _EmojiPickerSheet(),
  );
}

class _EmojiPickerSheet extends StatelessWidget {
  const _EmojiPickerSheet();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.7,
      ),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: t.divider,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text('Escolher emoji', style: AppTextStyles.h3(t.txtPrimary)),
                const Spacer(),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(''),
                  behavior: HitTestBehavior.opaque,
                  child: Text('Remover',
                      style: AppTextStyles.bodySm(t.error)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Flexible(
            child: GridView.builder(
              padding: EdgeInsets.fromLTRB(16, 0, 16, bottomPad + 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
              ),
              itemCount: _emojis.length,
              itemBuilder: (_, i) {
                final emoji = _emojis[i];
                return GestureDetector(
                  onTap: () => Navigator.of(context).pop(emoji),
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    decoration: BoxDecoration(
                      color: t.surfaceEl,
                      borderRadius: AppRadius.baseAll,
                      border: Border.all(color: t.mist),
                    ),
                    alignment: Alignment.center,
                    child: Text(emoji, style: AppTextStyles.emoji(fontSize: 24)),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
