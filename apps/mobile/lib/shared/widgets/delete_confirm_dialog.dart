import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Shows a standardised delete-confirmation dialog.
///
/// Returns `true` if the user confirmed, `false` / `null` if cancelled.
///
/// Usage:
/// ```dart
/// final confirmed = await showDeleteConfirmDialog(
///   context: context,
///   title: 'Delete Transaction',
///   itemName: transaction.subCategoryName,
/// );
/// if (confirmed == true) { /* proceed */ }
/// ```
Future<bool?> showDeleteConfirmDialog({
  required BuildContext context,
  required String title,
  required String itemName,
}) {
  return showDialog<bool>(
    context: context,
    builder: (_) => _DeleteConfirmDialog(title: title, itemName: itemName),
  );
}

class _DeleteConfirmDialog extends StatelessWidget {
  const _DeleteConfirmDialog({
    required this.title,
    required this.itemName,
  });

  final String title;
  final String itemName;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return AlertDialog(
      backgroundColor: t.bg,
      title: Text(title, style: AppTextStyles.h3(t.txtPrimary)),
      content: Text(
        'Tem certeza de que deseja excluir "$itemName"? Esta ação não pode ser desfeita.',
        style: AppTextStyles.body(t.txtSecondary),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text('Cancelar', style: AppTextStyles.body(t.txtTertiary)),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: Text(
            'Excluir',
            style: AppTextStyles.body(t.error)
                .copyWith(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
