import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../categories/data/models/category.dart';
import '../../categories/providers/categories_provider.dart';
import '../data/models/budget_models.dart';
import 'budget_wizard_widgets.dart';
import 'create_budget_state.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class CreateBudgetStep2Page extends ConsumerStatefulWidget {
  const CreateBudgetStep2Page({super.key});

  @override
  ConsumerState<CreateBudgetStep2Page> createState() =>
      _CreateBudgetStep2PageState();
}

class _CreateBudgetStep2PageState extends ConsumerState<CreateBudgetStep2Page> {
  late List<DraftArea> _areas;

  @override
  void initState() {
    super.initState();
    _areas = CreateBudgetState.instance.incomeAreas.isNotEmpty
        ? CreateBudgetState.instance.incomeAreas
        : [];
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(categoriesNotifierProvider);
    });
  }

  Set<int> get _usedSubcategoryIds =>
      _areas.expand((a) => a.subcategories).map((s) => s.id).toSet();

  bool get _canProceed =>
      _areas.isNotEmpty &&
      _areas.any((a) =>
          a.subcategories.isNotEmpty &&
          a.subcategories.any((s) => s.allocatedCents > 0));

  void _next() {
    if (!_canProceed) return;
    CreateBudgetState.instance.incomeAreas = _areas;
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
              bottom: MediaQuery.of(context).viewInsets.bottom),
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
                  placeholder: 'e.g. Salary, Freelance',
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
                      _areas.add(DraftArea(name: name, subcategories: []));
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

  void _showAddSubcategorySheet(int areaIndex) {
    final categories = ref.read(categoriesNotifierProvider).valueOrNull ?? [];
    final used = _usedSubcategoryIds;

    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black.withValues(alpha: 0.5),
        pageBuilder: (_, _, _) => _SubcategoryPickerPage(
          categories: categories,
          usedSubcategoryIds: used,
          onSelected: (sub, cents) {
            setState(() {
              _areas[areaIndex].subcategories.add(
                    DraftSubcategory(
                      id: sub.id,
                      name: sub.name,
                      categoryName: sub.categoryName ?? '',
                      allocatedCents: cents,
                    ),
                  );
            });
          },
        ),
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
                        child: Center(
                          child: Text('←',
                              style: TextStyle(
                                  fontSize: 18, color: t.txtPrimary)),
                        ),
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
                        'Expected income',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Create areas and add subcategories with the expected income for each.',
                        style: AppTextStyles.body(t.txtSecondary).copyWith(
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ..._areas.asMap().entries.map((entry) {
                        final i = entry.key;
                        final area = entry.value;
                        return _DraftAreaCard(
                          area: area,
                          allocationType: 'Income',
                          onAddSubcategory: () =>
                              _showAddSubcategorySheet(i),
                          onRemoveArea: () =>
                              setState(() => _areas.removeAt(i)),
                          onAmountChanged: () => setState(() {}),
                          onRemoveSubcategory: (subId) => setState(() {
                            _areas[i]
                                .subcategories
                                .removeWhere((s) => s.id == subId);
                          }),
                        );
                      }),
                      GestureDetector(
                        onTap: _showAddAreaSheet,
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            borderRadius: AppRadius.lgAll,
                            border: Border.all(
                              color: t.success.withValues(alpha: 0.4),
                              width: 1.5,
                              strokeAlign: BorderSide.strokeAlignInside,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('+',
                                  style: TextStyle(
                                      fontSize: 20,
                                      color: t.success,
                                      height: 1)),
                              const SizedBox(width: 6),
                              Text(
                                'Add Income Area',
                                style:
                                    AppTextStyles.body(t.success).copyWith(
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

              Padding(
                padding:
                    EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: 'Next: Expenses',
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
  final String allocationType;
  final VoidCallback onAddSubcategory;
  final VoidCallback onRemoveArea;
  final VoidCallback onAmountChanged;
  final void Function(int subId) onRemoveSubcategory;

  const _DraftAreaCard({
    required this.area,
    required this.allocationType,
    required this.onAddSubcategory,
    required this.onRemoveArea,
    required this.onAmountChanged,
    required this.onRemoveSubcategory,
  });

  @override
  State<_DraftAreaCard> createState() => _DraftAreaCardState();
}

class _DraftAreaCardState extends State<_DraftAreaCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final total = widget.area.totalAllocatedCents;
    final isIncome = widget.allocationType == 'Income';
    final accentColor = isIncome ? t.success : t.error;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
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
                            style:
                                AppTextStyles.body(t.txtPrimary).copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                          if (total > 0) ...[
                            const SizedBox(height: 2),
                            Text(
                              formatCurrency(total),
                              style: AppTextStyles.mono(accentColor,
                                      fontSize: 14)
                                  .copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onRemoveArea,
                      child: Text('×',
                          style: TextStyle(
                              fontSize: 22, color: t.error, height: 1)),
                    ),
                    const SizedBox(width: 6),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Text('▾',
                          style: TextStyle(
                              fontSize: 20,
                              color: t.txtTertiary,
                              height: 1)),
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              Divider(
                height: 1,
                thickness: 1,
                color:
                    t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              ...widget.area.subcategories.map((sub) => _SubcategoryRow(
                    sub: sub,
                    accentColor: accentColor,
                    onRemove: () =>
                        widget.onRemoveSubcategory(sub.id),
                    onAmountChanged: widget.onAmountChanged,
                  )),
              GestureDetector(
                onTap: widget.onAddSubcategory,
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      Text('+',
                          style: TextStyle(
                              fontSize: 18,
                              color: accentColor,
                              height: 1)),
                      const SizedBox(width: 6),
                      Text(
                        'Add Subcategory',
                        style: AppTextStyles.bodySm(accentColor).copyWith(
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

// ── Subcategory Row (inline amount field) ─────────────────────────────────────

class _SubcategoryRow extends StatefulWidget {
  final DraftSubcategory sub;
  final Color accentColor;
  final VoidCallback onRemove;
  final VoidCallback onAmountChanged;

  const _SubcategoryRow({
    required this.sub,
    required this.accentColor,
    required this.onRemove,
    required this.onAmountChanged,
  });

  @override
  State<_SubcategoryRow> createState() => _SubcategoryRowState();
}

class _SubcategoryRowState extends State<_SubcategoryRow> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final initialText = widget.sub.allocatedCents > 0
        ? const CentsInputFormatter()
            .formatEditUpdate(
              TextEditingValue.empty,
              TextEditingValue(text: widget.sub.allocatedCents.toString()),
            )
            .text
        : '';
    _controller = TextEditingController(text: initialText);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    widget.sub.allocatedCents = CentsInputFormatter.parseCents(value);
    widget.onAmountChanged();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.sub.name,
                  style: AppTextStyles.body(t.txtPrimary).copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (widget.sub.categoryName.isNotEmpty)
                  Text(
                    widget.sub.categoryName,
                    style: AppTextStyles.caption(t.txtTertiary)
                        .copyWith(fontSize: 11),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('R\$',
                  style: AppTextStyles.caption(widget.accentColor)
                      .copyWith(fontSize: 12, fontWeight: FontWeight.w500)),
              const SizedBox(width: 2),
              IntrinsicWidth(
                child: TextField(
                  controller: _controller,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    const CentsInputFormatter(),
                  ],
                  textAlign: TextAlign.right,
                  onChanged: _onChanged,
                  style: AppTextStyles.mono(widget.accentColor, fontSize: 14)
                      .copyWith(fontWeight: FontWeight.w700),
                  decoration: InputDecoration(
                    hintText: '0,00',
                    hintStyle: AppTextStyles.mono(
                            widget.accentColor.withValues(alpha: 0.35),
                            fontSize: 14)
                        .copyWith(fontWeight: FontWeight.w700),
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: widget.onRemove,
            child: Text('×',
                style:
                    TextStyle(fontSize: 20, color: t.error, height: 1)),
          ),
        ],
      ),
    );
  }
}

// ── Subcategory Picker Page (full-screen) ────────────────────────────────────

class _SubcategoryPickerPage extends StatefulWidget {
  final List<Category> categories;
  final Set<int> usedSubcategoryIds;
  final void Function(CategorySubcategory sub, int cents) onSelected;

  const _SubcategoryPickerPage({
    required this.categories,
    required this.usedSubcategoryIds,
    required this.onSelected,
  });

  @override
  State<_SubcategoryPickerPage> createState() => _SubcategoryPickerPageState();
}

class _SubcategoryPickerPageState extends State<_SubcategoryPickerPage> {
  final _searchController = TextEditingController();
  String _filter = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Category> get _filtered {
    final q = _filter.trim().toLowerCase();
    if (q.isEmpty) return widget.categories;
    return widget.categories
        .map((cat) {
          final catMatches = cat.name.toLowerCase().contains(q);
          final matchingSubs = cat.subcategories
              .where((s) => s.name.toLowerCase().contains(q))
              .toList();
          if (!catMatches && matchingSubs.isEmpty) return null;
          return Category(
            id: cat.id,
            name: cat.name,
            subcategories: catMatches ? cat.subcategories : matchingSubs,
          );
        })
        .whereType<Category>()
        .where((c) => c.subcategories.isNotEmpty)
        .toList();
  }

  void _onSubtap(CategorySubcategory sub) {
    _showAmountSheet(sub);
  }

  void _showAmountSheet(CategorySubcategory sub) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AmountSheet(
        subcategoryName: sub.name,
        categoryName: sub.categoryName ?? '',
        onConfirm: (cents) {
          widget.onSelected(sub, cents);
          Navigator.of(context).pop(); // close full-screen picker
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // App bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : t.primary.withValues(alpha: 0.08),
                        ),
                        child: Center(
                          child: Text('←',
                              style: TextStyle(
                                  fontSize: 18, color: t.txtPrimary)),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Select Subcategory',
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
              const SizedBox(height: 12),

              // Search
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: t.isDark
                        ? Colors.white.withValues(alpha: 0.06)
                        : t.primary.withValues(alpha: 0.05),
                    borderRadius: AppRadius.baseAll,
                    border: Border.all(
                        color: t.primary.withValues(alpha: 0.15)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _filter = v),
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontSize: 14),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 11),
                      hintText: 'Search subcategory...',
                      hintStyle: AppTextStyles.body(t.txtDisabled)
                          .copyWith(fontSize: 14),
                      prefixIcon: Icon(Icons.search,
                          size: 18, color: t.txtDisabled),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // List
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text(
                          'No subcategories available.',
                          style: AppTextStyles.body(t.txtTertiary)
                              .copyWith(fontSize: 14),
                        ),
                      )
                    : ListView(
                        padding: EdgeInsets.fromLTRB(
                            16, 8, 16, bottomPad + 32),
                        children: filtered.map((cat) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(
                                    top: 16, bottom: 8),
                                child: Text(
                                  cat.name.toUpperCase(),
                                  style:
                                      AppTextStyles.caption(t.primary)
                                          .copyWith(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: t.isDark
                                      ? const Color(0xFF1C1830)
                                          .withValues(alpha: 0.72)
                                      : Colors.white
                                          .withValues(alpha: 0.9),
                                  borderRadius: AppRadius.xlAll,
                                  border: Border.all(
                                    color: t.isDark
                                        ? Colors.white
                                            .withValues(alpha: 0.07)
                                        : t.primary
                                            .withValues(alpha: 0.12),
                                  ),
                                ),
                                child: Column(
                                  children: cat.subcategories
                                      .asMap()
                                      .entries
                                      .map((e) {
                                    final sub = e.value;
                                    final isLast = e.key ==
                                        cat.subcategories.length - 1;
                                    final isUsed = widget
                                        .usedSubcategoryIds
                                        .contains(sub.id);

                                    return Column(
                                      children: [
                                        GestureDetector(
                                          behavior:
                                              HitTestBehavior.opaque,
                                          onTap: isUsed
                                              ? null
                                              : () => _onSubtap(sub),
                                          child: Padding(
                                            padding: const EdgeInsets
                                                .symmetric(
                                                horizontal: 16,
                                                vertical: 14),
                                            child: Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    sub.name,
                                                    style: AppTextStyles
                                                        .body(isUsed
                                                            ? t.txtDisabled
                                                            : t.txtPrimary)
                                                        .copyWith(
                                                            fontSize:
                                                                14),
                                                  ),
                                                ),
                                                if (isUsed)
                                                  Text(
                                                    'Added',
                                                    style: AppTextStyles
                                                        .caption(
                                                            t.txtDisabled)
                                                        .copyWith(
                                                            fontSize:
                                                                11),
                                                  )
                                                else
                                                  Icon(
                                                    Icons.chevron_right,
                                                    size: 18,
                                                    color: t.txtDisabled,
                                                  ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        if (!isLast)
                                          Divider(
                                            height: 1,
                                            thickness: 1,
                                            indent: 16,
                                            color: t.divider.withValues(
                                                alpha: t.isDark
                                                    ? 0.2
                                                    : 0.4),
                                          ),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Amount Sheet ──────────────────────────────────────────────────────────────

class _AmountSheet extends StatefulWidget {
  final String subcategoryName;
  final String categoryName;
  final void Function(int cents) onConfirm;

  const _AmountSheet({
    required this.subcategoryName,
    required this.categoryName,
    required this.onConfirm,
  });

  @override
  State<_AmountSheet> createState() => _AmountSheetState();
}

class _AmountSheetState extends State<_AmountSheet> {
  final _controller = TextEditingController(text: '0,00');
  int _cents = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
              widget.subcategoryName,
              style: AppTextStyles.body(t.txtPrimary).copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            if (widget.categoryName.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                widget.categoryName,
                style: AppTextStyles.caption(t.txtTertiary)
                    .copyWith(fontSize: 12),
              ),
            ],
            const SizedBox(height: 20),
            Text(
              'Expected amount',
              style: AppTextStyles.caption(t.txtSecondary)
                  .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  'R\$',
                  style: AppTextStyles.mono(t.primary, fontSize: 20)
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 4),
                IntrinsicWidth(
                  stepWidth: 80,
                  child: TextField(
                    controller: _controller,
                    keyboardType: TextInputType.number,
                    autofocus: true,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      const CentsInputFormatter(),
                    ],
                    onChanged: (v) => setState(
                        () => _cents = CentsInputFormatter.parseCents(v)),
                    style: AppTextStyles.mono(t.primary, fontSize: 32)
                        .copyWith(
                            fontWeight: FontWeight.w700, letterSpacing: -1),
                    decoration: InputDecoration(
                      hintText: '0,00',
                      hintStyle: AppTextStyles.mono(
                              t.primary.withValues(alpha: 0.35),
                              fontSize: 32)
                          .copyWith(
                              fontWeight: FontWeight.w700, letterSpacing: -1),
                      filled: false,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              label: 'Add',
              onPressed: _cents > 0
                  ? () {
                      widget.onConfirm(_cents);
                      Navigator.of(context).pop();
                    }
                  : null,
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}
