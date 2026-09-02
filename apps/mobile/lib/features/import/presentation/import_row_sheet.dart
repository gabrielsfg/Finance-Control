import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../transactions/data/dtos/category_response_dto.dart';
import '../../transactions/providers/picker_providers.dart';
import '../data/import_models.dart';

/// Edits one line of the review list: which direction it goes and where it
/// lands. Everything else (date, value, description) comes from the statement
/// and is not up for editing here — the statement is the source of truth.
class ImportRowSheet extends ConsumerStatefulWidget {
  const ImportRowSheet({
    super.key,
    required this.row,
    required this.onTypeChanged,
    required this.onSubcategoryChanged,
  });

  final ImportRow row;
  final ValueChanged<String> onTypeChanged;
  final void Function(int? id, String? name) onSubcategoryChanged;

  @override
  ConsumerState<ImportRowSheet> createState() => _ImportRowSheetState();
}

class _ImportRowSheetState extends ConsumerState<ImportRowSheet> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final categories = ref.watch(categoriesProvider).valueOrNull ?? [];
    final filtered = _filter(categories, _query);

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.82,
        ),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppRadius.xl3),
          ),
          border: Border.all(color: t.mist),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.mist,
                  borderRadius: AppRadius.pillAll,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              widget.row.parsed.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.h3(t.txtPrimary),
            ),
            const SizedBox(height: 18),
            Text('TIPO', style: AppTextStyles.eyebrow(t.txtSecondary)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _TypeOption(
                    label: 'Despesa',
                    icon: LucideIcons.arrowDownRight,
                    color: t.clay,
                    selected: widget.row.type == 'Expense',
                    onTap: () => widget.onTypeChanged('Expense'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _TypeOption(
                    label: 'Receita',
                    icon: LucideIcons.arrowUpRight,
                    color: t.moss,
                    selected: widget.row.type == 'Income',
                    onTap: () => widget.onTypeChanged('Income'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'SUBCATEGORIA',
                    style: AppTextStyles.eyebrow(t.txtSecondary),
                  ),
                ),
                if (widget.row.subCategoryId != null)
                  GestureDetector(
                    onTap: () => widget.onSubcategoryChanged(null, null),
                    behavior: HitTestBehavior.opaque,
                    child: Text(
                      'Remover',
                      style: AppTextStyles.bodySm(t.accent)
                          .copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            AppInputField(
              controller: _searchController,
              placeholder: 'Buscar categoria',
              leftIcon: Icon(LucideIcons.search, size: 18, color: t.txtTertiary),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: filtered.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Text(
                        'Nenhuma categoria encontrada.',
                        style: AppTextStyles.bodySm(t.txtTertiary),
                      ),
                    )
                  : ListView(
                      shrinkWrap: true,
                      children: [
                        for (final category in filtered) ...[
                          Padding(
                            padding: const EdgeInsets.only(top: 10, bottom: 6),
                            child: Text(
                              category.name.toUpperCase(),
                              style: AppTextStyles.eyebrow(t.txtTertiary),
                            ),
                          ),
                          for (final sub in category.subCategories)
                            _SubcategoryOption(
                              name: sub.name,
                              selected: sub.id == widget.row.subCategoryId,
                              onTap: () =>
                                  widget.onSubcategoryChanged(sub.id, sub.name),
                            ),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Keeps a category when its own name matches, otherwise narrows it down to
  /// the subcategories that do.
  List<CategoryResponseDto> _filter(
    List<CategoryResponseDto> categories,
    String query,
  ) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return categories;

    return categories
        .map((category) {
          if (category.name.toLowerCase().contains(q)) return category;
          final subs = category.subCategories
              .where((s) => s.name.toLowerCase().contains(q))
              .toList();
          if (subs.isEmpty) return null;
          return CategoryResponseDto(
            id: category.id,
            name: category.name,
            subCategories: subs,
          );
        })
        .whereType<CategoryResponseDto>()
        .where((c) => c.subCategories.isNotEmpty)
        .toList();
  }
}

class _TypeOption extends StatelessWidget {
  const _TypeOption({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: selected
              ? color.withValues(alpha: t.isDark ? 0.18 : 0.1)
              : t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(
            color: selected ? color.withValues(alpha: 0.5) : t.mist,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: selected ? color : t.txtTertiary),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTextStyles.body(selected ? color : t.txtSecondary)
                  .copyWith(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

class _SubcategoryOption extends StatelessWidget {
  const _SubcategoryOption({
    required this.name,
    required this.selected,
    required this.onTap,
  });

  final String name;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 11),
        child: Row(
          children: [
            Expanded(
              child: Text(
                name,
                style: AppTextStyles.body(
                  selected ? t.accent : t.txtPrimary,
                ).copyWith(fontSize: 14),
              ),
            ),
            if (selected) Icon(LucideIcons.check, size: 17, color: t.accent),
          ],
        ),
      ),
    );
  }
}
