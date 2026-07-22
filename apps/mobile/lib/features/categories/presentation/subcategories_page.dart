import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/category_palette.dart';
import '../../../core/utils/color_hex.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/category.dart';
import '../providers/categories_provider.dart';
import '../providers/subcategories_provider.dart';

class SubcategoriesPage extends ConsumerWidget {
  const SubcategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final categoriesAsync = ref.watch(categoriesNotifierProvider);

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                _Header(),
                const SizedBox(height: 24),
                categoriesAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (_, __) => Center(
                    child: Text('Não foi possível carregar as categorias.',
                        style: AppTextStyles.body(t.error)),
                  ),
                  data: (categories) => categories.isEmpty
                      ? Center(
                          child: Text('Nenhuma categoria encontrada.',
                              style: AppTextStyles.body(t.txtSecondary)),
                        )
                      : Column(
                          children: categories
                              .map((c) => _CategorySection(category: c))
                              .toList(),
                        ),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.primary.withValues(alpha: t.isDark ? 0.15 : 0.1),
              border: Border.all(color: t.primary.withValues(alpha: 0.25)),
            ),
            child: Icon(LucideIcons.chevronLeft, size: 18, color: t.primary),
          ),
        ),
        Expanded(
          child: Text(
            'Subcategorias',
            textAlign: TextAlign.center,
            style: AppTextStyles.body(t.txtPrimary)
                .copyWith(fontWeight: FontWeight.w700, fontSize: 17),
          ),
        ),
        const SizedBox(width: 36),
      ],
    );
  }
}

// ── Category Section ───────────────────────────────────────────────────────

class _CategorySection extends ConsumerWidget {
  const _CategorySection({required this.category});

  final Category category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassCard(
        padding: EdgeInsets.zero,
        borderRadius: AppRadius.xlAll,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Category header ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: categoryColor(category.color, category.name)
                        .withValues(alpha: 0.16),
                    borderRadius: AppRadius.mdAll,
                  ),
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: categoryColor(category.color, category.name),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    category.name,
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                GestureDetector(
                  onTap: () => _showAddDialog(context, ref),
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: t.primary.withValues(alpha: 0.12),
                    ),
                    child: Icon(LucideIcons.plus, size: 14, color: t.primary),
                  ),
                ),
              ],
            ),
          ),

          // ── Subcategory rows ─────────────────────────────────────────
          if (category.subcategories.isNotEmpty) ...[
            Divider(
              height: 1,
              thickness: 1,
              indent: 14,
              endIndent: 14,
              color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
            ),
            ...category.subcategories.map(
              (sub) => _SubcategoryRow(
                sub: sub,
                isLast: sub == category.subcategories.last,
              ),
            ),
          ] else
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Text(
                'Nenhuma subcategoria ainda.',
                style: AppTextStyles.caption(t.txtTertiary),
              ),
            ),
        ],
      ),
      ),
    );
  }

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (_) => _SubcategoryDialog(
        title: 'Nova subcategoria',
        categoryId: category.id,
        onSave: (name) async {
          await ref
              .read(subcategoriesNotifierProvider.notifier)
              .create(name, category.id);
        },
      ),
    );
  }
}

// ── Subcategory Row ────────────────────────────────────────────────────────

class _SubcategoryRow extends ConsumerWidget {
  const _SubcategoryRow({required this.sub, required this.isLast});

  final CategorySubcategory sub;
  final bool isLast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          child: Row(
            children: [
              if (sub.emoji?.isNotEmpty ?? false)
                Padding(
                  padding: const EdgeInsets.only(left: 2, right: 10),
                  child:
                      Text(sub.emoji!, style: AppTextStyles.emoji(fontSize: 16)),
                )
              else
                Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.only(left: 6, right: 12),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: colorFromHex(sub.categoryColor, fallback: t.accent),
                  ),
                ),
              Expanded(
                child: Text(
                  sub.name,
                  style: AppTextStyles.bodySm(t.txtSecondary),
                ),
              ),
              // Edit
              GestureDetector(
                onTap: () => _showEditDialog(context, ref),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Icon(LucideIcons.pencil, size: 14, color: t.txtTertiary),
                ),
              ),
              // Delete
              GestureDetector(
                onTap: () => _confirmDelete(context, ref),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Icon(LucideIcons.trash2, size: 14, color: t.error),
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          Divider(
            height: 1,
            thickness: 1,
            indent: 36,
            endIndent: 14,
            color: t.divider.withValues(alpha: t.isDark ? 0.15 : 0.3),
          ),
      ],
    );
  }

  void _showEditDialog(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (_) => _SubcategoryDialog(
        title: 'Editar subcategoria',
        categoryId: sub.categoryId,
        initialName: sub.name,
        onSave: (name) async {
          await ref
              .read(subcategoriesNotifierProvider.notifier)
              .updateSubcategory(sub.id, name, sub.categoryId);
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: t.surface,
        title: Text('Excluir subcategoria?',
            style: AppTextStyles.h3(t.txtPrimary)),
        content: Text(
          'Excluir "${sub.name}"? As transações vinculadas a ela manterão a referência.',
          style: AppTextStyles.body(t.txtSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancelar', style: AppTextStyles.body(t.txtSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(subcategoriesNotifierProvider.notifier).delete(sub.id);
            },
            child: Text('Excluir', style: AppTextStyles.body(t.error)),
          ),
        ],
      ),
    );
  }
}

// ── Dialog ─────────────────────────────────────────────────────────────────

class _SubcategoryDialog extends StatefulWidget {
  const _SubcategoryDialog({
    required this.title,
    required this.categoryId,
    required this.onSave,
    this.initialName,
  });

  final String title;
  final int categoryId;
  final String? initialName;
  final Future<void> Function(String name) onSave;

  @override
  State<_SubcategoryDialog> createState() => _SubcategoryDialogState();
}

class _SubcategoryDialogState extends State<_SubcategoryDialog> {
  late final TextEditingController _controller;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialName ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _controller.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Informe o nome.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.onSave(name);
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Não foi possível salvar. Tente novamente.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return AlertDialog(
      backgroundColor: t.surface,
      title: Text(widget.title, style: AppTextStyles.h3(t.txtPrimary)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppInputField(
            placeholder: 'Nome da subcategoria',
            controller: _controller,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.done,
            onSubmitted: _submit,
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: AppTextStyles.caption(t.error)),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.of(context).pop(),
          child: Text('Cancelar', style: AppTextStyles.body(t.txtSecondary)),
        ),
        TextButton(
          onPressed: _loading ? null : _submit,
          child: _loading
              ? SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: t.accent),
                )
              : Text('Salvar', style: AppTextStyles.body(t.accent)),
        ),
      ],
    );
  }
}
