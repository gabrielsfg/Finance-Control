import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/category.dart';
import '../providers/categories_provider.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class CategoriesPage extends ConsumerWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesNotifierProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    final t = AppThemeTokens.of(context);

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
                const _Header(),
                const SizedBox(height: 24),
                categoriesAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) => _ErrorView(
                    onRetry: () =>
                        ref.read(categoriesNotifierProvider.notifier).refresh(),
                  ),
                  data: (categories) => _CategoryList(categories: categories),
                ),
                SizedBox(height: bottomPad + 24),
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
  const _Header();

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
              border: Border.all(
                color: t.primary.withValues(alpha: 0.25),
                width: 1,
              ),
            ),
            child: Icon(LucideIcons.chevronLeft, size: 18, color: t.primary),
          ),
        ),
        Expanded(
          child: Text(
            'Categorias',
            textAlign: TextAlign.center,
            style: AppTextStyles.body(t.txtPrimary).copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
        ),
        GestureDetector(
          onTap: () => context.push('/categories/subcategories'),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.primary.withValues(alpha: t.isDark ? 0.15 : 0.1),
              border: Border.all(
                color: t.primary.withValues(alpha: 0.25),
                width: 1,
              ),
            ),
            child: Icon(LucideIcons.listTree, size: 16, color: t.primary),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => context.push('/categories/edit'),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: t.primary.withValues(alpha: t.isDark ? 0.15 : 0.1),
              border: Border.all(
                color: t.primary.withValues(alpha: 0.25),
                width: 1,
              ),
            ),
            child: Icon(LucideIcons.pencil, size: 16, color: t.primary),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => context.push('/categories/create'),
          child: Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.primaryGradient,
            ),
            child: const Icon(LucideIcons.plus, color: Colors.white, size: 18),
          ),
        ),
      ],
    );
  }
}

// ── Category List ──────────────────────────────────────────────────────────

class _CategoryList extends StatelessWidget {
  final List<Category> categories;

  const _CategoryList({required this.categories});

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) {
      return const _EmptyView();
    }

    return Column(
      children: categories
          .map((category) => _CategoryCard(category: category))
          .toList(),
    );
  }
}

// ── Category Card ──────────────────────────────────────────────────────────

class _CategoryCard extends ConsumerStatefulWidget {
  final Category category;

  const _CategoryCard({required this.category});

  @override
  ConsumerState<_CategoryCard> createState() => _CategoryCardState();
}

class _CategoryCardState extends ConsumerState<_CategoryCard> {
  bool _expanded = false;

  void _confirmDelete(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final subCount = widget.category.subcategories.length;
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: t.surface,
        title: Text('Excluir categoria?', style: AppTextStyles.h3(t.txtPrimary)),
        content: Text(
          subCount > 0
              ? 'Excluir "${widget.category.name}" e suas $subCount ${subCount == 1 ? 'subcategoria' : 'subcategorias'}? As transações vinculadas a elas manterão a referência.'
              : 'Excluir "${widget.category.name}"? Esta ação não pode ser desfeita.',
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
              ref
                  .read(categoriesNotifierProvider.notifier)
                  .deleteCategory(widget.category.id);
            },
            child: Text('Excluir', style: AppTextStyles.body(t.error)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final hasSubs = widget.category.subcategories.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        borderRadius: AppRadius.xlAll,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 8, 14),
            child: Row(
              children: [
                GestureDetector(
                  onTap: hasSubs ? () => setState(() => _expanded = !_expanded) : null,
                  behavior: HitTestBehavior.opaque,
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: t.accent.withValues(alpha: 0.14),
                          borderRadius: AppRadius.lgAll,
                        ),
                        child: Icon(LucideIcons.tag, color: t.accent, size: 18),
                      ),
                      const SizedBox(width: 12),
                    ],
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: hasSubs ? () => setState(() => _expanded = !_expanded) : null,
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.category.name,
                          style: AppTextStyles.body(t.txtPrimary).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${widget.category.subcategories.length} ${widget.category.subcategories.length == 1 ? 'subcategoria' : 'subcategorias'}',
                          style: AppTextStyles.caption(t.txtTertiary),
                        ),
                      ],
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => _confirmDelete(context),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Icon(LucideIcons.trash2, size: 16, color: t.error),
                  ),
                ),
                GestureDetector(
                  onTap: hasSubs ? () => setState(() => _expanded = !_expanded) : null,
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: AnimatedRotation(
                      turns: _expanded ? 0.25 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(LucideIcons.chevronRight,
                          size: 16, color: hasSubs ? t.txtDisabled : Colors.transparent),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // ── Subcategory list ─────────────────────────────────────────
          if (hasSubs && _expanded) ...[
            Divider(
              height: 1,
              thickness: 1,
              indent: 14,
              endIndent: 14,
              color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
            ),
            ...widget.category.subcategories.map(
              (sub) => _SubcategoryRow(name: sub.name, isLast: sub == widget.category.subcategories.last),
            ),
          ],
        ],
        ),
      ),
    );
  }
}

// ── Subcategory Row ────────────────────────────────────────────────────────

class _SubcategoryRow extends StatelessWidget {
  final String name;
  final bool isLast;

  const _SubcategoryRow({required this.name, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: t.accent,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                name,
                style: AppTextStyles.bodySm(t.txtSecondary).copyWith(
                  fontSize: 13,
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
}

// ── Empty View ─────────────────────────────────────────────────────────────

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Center(
      child: Column(
        children: [
          const SizedBox(height: 48),
          Icon(LucideIcons.tag, size: 40, color: t.txtDisabled),
          const SizedBox(height: 12),
          Text(
            'Nenhuma categoria encontrada',
            style: AppTextStyles.body(t.txtSecondary),
          ),
        ],
      ),
    );
  }
}

// ── Error View ─────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Center(
      child: Column(
        children: [
          const SizedBox(height: 48),
          Icon(LucideIcons.alertCircle, color: t.error, size: 32),
          const SizedBox(height: 8),
          Text(
            'Não foi possível carregar as categorias',
            style: AppTextStyles.body(t.txtSecondary),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Tentar novamente')),
        ],
      ),
    );
  }
}
