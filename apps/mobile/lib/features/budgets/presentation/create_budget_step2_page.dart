import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/budget_models.dart';
import 'budget_wizard_widgets.dart';
import 'create_budget_state.dart';

// ── Available categories catalogue (mock — TODO: load from API) ──────────────

final _kAvailableCategories = [
  DraftCategory(
    id: 1,
    name: 'Housing',
    icon: Icons.home_outlined,
    color: const Color(0xFF8B5CF6),
    subcategories: [
      DraftSubcategory(id: 1, name: 'Rent'),
      DraftSubcategory(id: 2, name: 'Utilities'),
      DraftSubcategory(id: 3, name: 'Internet'),
      DraftSubcategory(id: 4, name: 'Maintenance'),
    ],
  ),
  DraftCategory(
    id: 2,
    name: 'Food',
    icon: Icons.restaurant_outlined,
    color: const Color(0xFFF59E0B),
    subcategories: [
      DraftSubcategory(id: 5, name: 'Groceries'),
      DraftSubcategory(id: 6, name: 'Delivery'),
      DraftSubcategory(id: 7, name: 'Restaurants'),
      DraftSubcategory(id: 8, name: 'Café'),
    ],
  ),
  DraftCategory(
    id: 3,
    name: 'Transport',
    icon: Icons.directions_car_outlined,
    color: const Color(0xFF06B6D4),
    subcategories: [
      DraftSubcategory(id: 9, name: 'Ride apps'),
      DraftSubcategory(id: 10, name: 'Fuel'),
      DraftSubcategory(id: 11, name: 'Public transit'),
      DraftSubcategory(id: 12, name: 'Parking'),
    ],
  ),
  DraftCategory(
    id: 4,
    name: 'Health',
    icon: Icons.favorite_outline,
    color: const Color(0xFFEF4444),
    subcategories: [
      DraftSubcategory(id: 13, name: 'Pharmacy'),
      DraftSubcategory(id: 14, name: 'Doctor'),
      DraftSubcategory(id: 15, name: 'Gym'),
      DraftSubcategory(id: 16, name: 'Insurance'),
    ],
  ),
  DraftCategory(
    id: 5,
    name: 'Education',
    icon: Icons.school_outlined,
    color: const Color(0xFF3B82F6),
    subcategories: [
      DraftSubcategory(id: 17, name: 'Courses'),
      DraftSubcategory(id: 18, name: 'Books'),
      DraftSubcategory(id: 19, name: 'Software'),
    ],
  ),
  DraftCategory(
    id: 6,
    name: 'Leisure',
    icon: Icons.sports_esports_outlined,
    color: const Color(0xFF22C55E),
    subcategories: [
      DraftSubcategory(id: 20, name: 'Streaming'),
      DraftSubcategory(id: 21, name: 'Gaming'),
      DraftSubcategory(id: 22, name: 'Travel'),
      DraftSubcategory(id: 23, name: 'Hobbies'),
    ],
  ),
];

// ── Page ───────────────────────────────────────────────────────────────────

class CreateBudgetStep2Page extends StatefulWidget {
  const CreateBudgetStep2Page({super.key});

  @override
  State<CreateBudgetStep2Page> createState() => _CreateBudgetStep2PageState();
}

class _CreateBudgetStep2PageState extends State<CreateBudgetStep2Page> {
  late List<DraftArea> _areas;

  @override
  void initState() {
    super.initState();
    // Resume draft if returning from step 3
    if (CreateBudgetState.instance.areas.isNotEmpty) {
      _areas = CreateBudgetState.instance.areas;
    } else {
      _areas = [];
    }
  }

  bool get _canProceed =>
      _areas.isNotEmpty &&
      _areas.any((a) =>
          a.categories.isNotEmpty &&
          a.categories.any((c) =>
              c.subcategories.any((s) => s.allocatedCents > 0)));

  void _addArea() {
    _showAddAreaSheet();
  }

  void _next() {
    if (!_canProceed) return;
    CreateBudgetState.instance.areas = _areas;
    context.push('/budgets/create/step3');
  }

  void _showAddAreaSheet() {
    final nameController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        final t = AppThemeTokens.of(context);
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
              borderRadius: AppRadius.xlAll,
              border: Border.all(
                color: t.isDark
                    ? Colors.white.withValues(alpha: 0.07)
                    : t.primary.withValues(alpha: 0.13),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Area name',
                  style: AppTextStyles.body(t.txtPrimary).copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 14),
                AppInputField(
                  placeholder: 'e.g. Housing, Daily Life',
                  controller: nameController,
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Add Area',
                  onPressed: () {
                    final name = nameController.text.trim();
                    if (name.isEmpty) return;
                    setState(() {
                      _areas.add(DraftArea(name: name, categories: []));
                    });
                    Navigator.of(context).pop();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _addCategoryToArea(int areaIndex) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CategoryPickerSheet(
        existingCategoryIds: _areas[areaIndex]
            .categories
            .map((c) => c.id)
            .toSet(),
        onSelected: (cat) {
          setState(() {
            _areas[areaIndex].categories.add(cat);
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── App bar ────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : t.primary.withValues(alpha: 0.08),
                        ),
                        child: Icon(Icons.arrow_back,
                            size: 18, color: t.txtPrimary),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'New Budget',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    const SizedBox(width: 36),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const BudgetStepIndicator(current: 2),
              const SizedBox(height: 24),

              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Define areas',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Group your categories into areas and set the amount for each subcategory.',
                        style: AppTextStyles.body(t.txtSecondary).copyWith(
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Areas list
                      ..._areas.asMap().entries.map((entry) {
                        final areaIndex = entry.key;
                        final area = entry.value;
                        return _DraftAreaCard(
                          area: area,
                          onAddCategory: () => _addCategoryToArea(areaIndex),
                          onRemoveArea: () =>
                              setState(() => _areas.removeAt(areaIndex)),
                          onAmountChanged: () => setState(() {}),
                        );
                      }),
                      // Add area button
                      GestureDetector(
                        onTap: _addArea,
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            borderRadius: AppRadius.lgAll,
                            border: Border.all(
                              color: t.isDark
                                  ? t.primary.withValues(alpha: 0.35)
                                  : t.primary.withValues(alpha: 0.3),
                              width: 1.5,
                              strokeAlign: BorderSide.strokeAlignInside,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add, size: 18, color: t.primary),
                              const SizedBox(width: 6),
                              Text(
                                'Add Area',
                                style: AppTextStyles.body(t.primary).copyWith(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),

              // ── Next button ────────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: 'Next: Review',
                  onPressed: _canProceed ? _next : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Draft Area Card ───────────────────────────────────────────────────────────

class _DraftAreaCard extends StatefulWidget {
  final DraftArea area;
  final VoidCallback onAddCategory;
  final VoidCallback onRemoveArea;
  final VoidCallback onAmountChanged;

  const _DraftAreaCard({
    required this.area,
    required this.onAddCategory,
    required this.onRemoveArea,
    required this.onAmountChanged,
  });

  @override
  State<_DraftAreaCard> createState() => _DraftAreaCardState();
}

class _DraftAreaCardState extends State<_DraftAreaCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final totalCents = widget.area.totalAllocatedCents;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            // Area header
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.area.name,
                            style: AppTextStyles.body(t.txtPrimary).copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          if (totalCents > 0) ...[
                            const SizedBox(height: 2),
                            Text(
                              formatCurrency(totalCents),
                              style: AppTextStyles.mono(t.primary, fontSize: 12)
                                  .copyWith(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onRemoveArea,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.error.withValues(alpha: 0.1),
                        ),
                        child: Icon(Icons.close, size: 14, color: t.error),
                      ),
                    ),
                    const SizedBox(width: 6),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.expand_more,
                          size: 20, color: t.txtTertiary),
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              Divider(
                height: 1,
                thickness: 1,
                color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              // Categories
              ...widget.area.categories.asMap().entries.map((entry) {
                final catIndex = entry.key;
                final cat = entry.value;
                return _DraftCategorySection(
                  category: cat,
                  onRemove: () => setState(
                    () => widget.area.categories.removeAt(catIndex),
                  ),
                  onAmountChanged: widget.onAmountChanged,
                  showBottomDivider:
                      catIndex < widget.area.categories.length - 1,
                );
              }),
              // Add category button
              GestureDetector(
                onTap: widget.onAddCategory,
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      Icon(Icons.add, size: 16, color: t.primary),
                      const SizedBox(width: 6),
                      Text(
                        'Add Category',
                        style: AppTextStyles.bodySm(t.primary).copyWith(
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Draft Category Section ────────────────────────────────────────────────────

class _DraftCategorySection extends StatefulWidget {
  final DraftCategory category;
  final VoidCallback onRemove;
  final VoidCallback onAmountChanged;
  final bool showBottomDivider;

  const _DraftCategorySection({
    required this.category,
    required this.onRemove,
    required this.onAmountChanged,
    this.showBottomDivider = true,
  });

  @override
  State<_DraftCategorySection> createState() => _DraftCategorySectionState();
}

class _DraftCategorySectionState extends State<_DraftCategorySection> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final cat = widget.category;
    final total = cat.totalAllocatedCents;

    return Column(
      children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: cat.color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(cat.icon, color: cat.color, size: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cat.name,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      if (total > 0)
                        Text(
                          formatCurrency(total),
                          style: AppTextStyles.caption(t.primary)
                              .copyWith(fontSize: 11),
                        ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: widget.onRemove,
                  child: Icon(Icons.remove_circle_outline,
                      size: 18, color: t.error),
                ),
                const SizedBox(width: 6),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.expand_more,
                      size: 16, color: t.txtDisabled),
                ),
              ],
            ),
          ),
        ),
        if (_expanded) ...[
          ...cat.subcategories.map((sub) => _SubcategoryAmountRow(
                sub: sub,
                onChanged: widget.onAmountChanged,
              )),
          const SizedBox(height: 4),
        ],
        if (widget.showBottomDivider)
          Divider(
            height: 1,
            thickness: 1,
            indent: 16,
            endIndent: 16,
            color: t.divider.withValues(alpha: t.isDark ? 0.25 : 0.45),
          ),
      ],
    );
  }
}

// ── Subcategory Amount Row ────────────────────────────────────────────────────

class _SubcategoryAmountRow extends StatefulWidget {
  final DraftSubcategory sub;
  final VoidCallback onChanged;

  const _SubcategoryAmountRow({
    required this.sub,
    required this.onChanged,
  });

  @override
  State<_SubcategoryAmountRow> createState() => _SubcategoryAmountRowState();
}

class _SubcategoryAmountRowState extends State<_SubcategoryAmountRow> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.sub.allocatedCents > 0
          ? (widget.sub.allocatedCents / 100).toStringAsFixed(2)
          : '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    final cleaned = value.replaceAll(',', '.');
    final parsed = double.tryParse(cleaned) ?? 0.0;
    widget.sub.allocatedCents = (parsed * 100).round();
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.only(left: 58, right: 16, bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              widget.sub.name,
              style: AppTextStyles.bodySm(t.txtSecondary).copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 110,
            height: 36,
            child: Container(
              decoration: BoxDecoration(
                color: t.isDark
                    ? Colors.white.withValues(alpha: 0.05)
                    : t.primary.withValues(alpha: 0.05),
                borderRadius: AppRadius.smAll,
                border: Border.all(
                  color: t.isDark
                      ? Colors.white.withValues(alpha: 0.1)
                      : t.primary.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Text(
                      'R\$',
                      style: AppTextStyles.caption(t.txtTertiary)
                          .copyWith(fontSize: 11),
                    ),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(
                            RegExp(r'^\d{0,9}([,\.]\d{0,2})?')),
                      ],
                      textAlign: TextAlign.right,
                      onChanged: _onChanged,
                      style: AppTextStyles.body(t.txtPrimary).copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      decoration: InputDecoration(
                        hintText: '0,00',
                        hintStyle: AppTextStyles.body(
                          t.txtDisabled,
                        ).copyWith(fontSize: 13),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 0),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Category Picker Sheet ─────────────────────────────────────────────────────

class _CategoryPickerSheet extends StatelessWidget {
  final Set<int> existingCategoryIds;
  final ValueChanged<DraftCategory> onSelected;

  const _CategoryPickerSheet({
    required this.existingCategoryIds,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final available = _kAvailableCategories
        .where((c) => !existingCategoryIds.contains(c.id))
        .toList();

    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      decoration: BoxDecoration(
        color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
        borderRadius: AppRadius.xlAll,
        border: Border.all(
          color: t.isDark
              ? Colors.white.withValues(alpha: 0.07)
              : t.primary.withValues(alpha: 0.13),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select category',
            style: AppTextStyles.body(t.txtPrimary).copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 14),
          if (available.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'All categories are already added.',
                  style: AppTextStyles.body(t.txtTertiary)
                      .copyWith(fontSize: 13),
                ),
              ),
            )
          else
            ...available.map((cat) {
              return GestureDetector(
                onTap: () {
                  // Deep-copy so edits in this area don't affect another area
                  final copy = DraftCategory(
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                    subcategories: cat.subcategories
                        .map((s) => DraftSubcategory(
                              id: s.id,
                              name: s.name,
                              allocatedCents: 0,
                            ))
                        .toList(),
                  );
                  onSelected(copy);
                  Navigator.of(context).pop();
                },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: cat.color.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(cat.icon, color: cat.color, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        cat.name,
                        style: AppTextStyles.body(t.txtPrimary)
                            .copyWith(fontSize: 14),
                      ),
                      const Spacer(),
                      Text(
                        '${cat.subcategories.length} subcategories',
                        style: AppTextStyles.bodySm(t.txtTertiary)
                            .copyWith(fontSize: 11),
                      ),
                    ],
                  ),
                ),
              );
            }),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
