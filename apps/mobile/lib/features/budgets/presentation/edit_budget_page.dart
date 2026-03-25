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
import '../data/budget_repository.dart';
import '../data/dtos/update_budget_request_dto.dart';
import '../data/models/budget_models.dart';
import '../providers/budget_provider.dart';

// ── Recurrence options ────────────────────────────────────────────────────────

final _kRecurrenceOptions = [
  'Monthly',
  'Weekly',
  'Biweekly',
  'Semiannually',
  'Annually',
];

// ── Editable draft models ─────────────────────────────────────────────────────

class _EditDraftSubcategory {
  final int? allocationId; // null = new
  final int subcategoryId;
  final String name;
  final String categoryName;
  final String allocationType;
  int allocatedCents;

  _EditDraftSubcategory({
    required this.allocationId,
    required this.subcategoryId,
    required this.name,
    required this.categoryName,
    required this.allocationType,
    required this.allocatedCents,
  });
}

class _EditDraftArea {
  final int? areaId; // null = new
  String name;
  final String allocationType; // 'Income' | 'Expense'
  final List<_EditDraftSubcategory> subcategories;

  _EditDraftArea({
    required this.areaId,
    required this.name,
    required this.allocationType,
    required this.subcategories,
  });

  int get totalCents =>
      subcategories.fold(0, (s, x) => s + x.allocatedCents);
}

// ── Page ───────────────────────────────────────────────────────────────────────

class EditBudgetPage extends ConsumerStatefulWidget {
  final Budget budget;

  const EditBudgetPage({super.key, required this.budget});

  @override
  ConsumerState<EditBudgetPage> createState() => _EditBudgetPageState();
}

class _EditBudgetPageState extends ConsumerState<EditBudgetPage> {
  late TextEditingController _nameController;
  late String _recurrence;
  late int _startDay;
  late List<_EditDraftArea> _areas;

  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final b = widget.budget;
    _nameController = TextEditingController(text: b.name);
    _recurrence = b.recurrence;
    _startDay = b.startDate.day;

    _areas = b.areas.map((area) {
      final allSubs = area.categories.expand((c) => c.subcategories).toList();
      return _EditDraftArea(
        areaId: area.id,
        name: area.name,
        allocationType: area.allocationType,
        subcategories: allSubs
            .map((s) => _EditDraftSubcategory(
                  allocationId: s.allocationId,
                  subcategoryId: s.id,
                  name: s.name,
                  categoryName: '',
                  allocationType: s.allocationType,
                  allocatedCents: s.allocatedCents,
                ))
            .toList(),
      );
    }).toList();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(categoriesNotifierProvider);
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Set<int> get _usedSubcategoryIds =>
      _areas.expand((a) => a.subcategories).map((s) => s.subcategoryId).toSet();

  bool get _canSave => _nameController.text.trim().isNotEmpty;

  Future<void> _save() async {
    if (!_canSave) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final dto = UpdateBudgetRequestDto(
        id: widget.budget.id,
        name: _nameController.text.trim(),
        startDate: _startDay,
        recurrence: _recurrence,
        isActive: true,
        areas: _areas.map((a) {
          return UpdateAreaInBudgetDto(
            id: a.areaId,
            name: a.name,
            allocations: a.subcategories
                .where((s) => s.allocatedCents > 0)
                .map((s) => UpdateAllocationInBudgetDto(
                      id: s.allocationId,
                      subCategoryId: s.subcategoryId,
                      expectedValue: s.allocatedCents,
                      allocationType: s.allocationType,
                    ))
                .toList(),
          );
        }).toList(),
      );
      await ref
          .read(budgetRepositoryProvider)
          .updateBudget(dto);
      await ref.read(budgetNotifierProvider.notifier).refresh();
      if (!mounted) return;
      context.pop();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to save. Please try again.';
      });
    }
  }

  Future<void> _deleteBudget() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final t = AppThemeTokens.of(ctx);
        return AlertDialog(
          backgroundColor:
              t.isDark ? const Color(0xFF1C1830) : Colors.white,
          title: Text('Delete budget?',
              style: AppTextStyles.h3(t.txtPrimary)),
          content: Text(
            'This will permanently delete "${widget.budget.name}" and all its data.',
            style: AppTextStyles.body(t.txtSecondary).copyWith(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child:
                  Text('Cancel', style: AppTextStyles.body(t.txtTertiary)),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: Text('Delete',
                  style: AppTextStyles.body(t.error)
                      .copyWith(fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
    if (confirmed != true || !mounted) return;
    setState(() => _isLoading = true);
    try {
      await ref
          .read(budgetNotifierProvider.notifier)
          .deleteBudget(widget.budget.id);
      if (!mounted) return;
      context.go('/budgets');
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to delete. Please try again.';
      });
    }
  }

  void _addArea(String allocationType) {
    final nameController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
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
                  'Area name',
                  style: AppTextStyles.body(t.txtPrimary)
                      .copyWith(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                const SizedBox(height: 14),
                AppInputField(
                  placeholder:
                      allocationType == 'Income' ? 'e.g. Salary' : 'e.g. Housing',
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
                      _areas.add(_EditDraftArea(
                        areaId: null,
                        name: name,
                        allocationType: allocationType,
                        subcategories: [],
                      ));
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

  void _showSubcategoryPicker(int areaIndex) {
    final categories = ref.read(categoriesNotifierProvider).valueOrNull ?? [];
    final used = _usedSubcategoryIds;
    final area = _areas[areaIndex];

    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black.withValues(alpha: 0.5),
        pageBuilder: (_, _, _) => _SubcategoryPickerPage(
          categories: categories,
          usedSubcategoryIds: used,
          onSelected: (sub, cents) {
            setState(() {
              area.subcategories.add(_EditDraftSubcategory(
                allocationId: null,
                subcategoryId: sub.id,
                name: sub.name,
                categoryName: sub.categoryName ?? '',
                allocationType: area.allocationType,
                allocatedCents: cents,
              ));
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
    final incomeAreas =
        _areas.where((a) => a.allocationType == 'Income').toList();
    final expenseAreas =
        _areas.where((a) => a.allocationType == 'Expense').toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── App bar ─────────────────────────────────────────────────
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
                              style:
                                  TextStyle(fontSize: 18, color: t.txtPrimary)),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Edit Budget',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: _isLoading ? null : _deleteBudget,
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.error.withValues(alpha: 0.1),
                        ),
                        child: Center(
                          child: Icon(Icons.delete_outline,
                              size: 18, color: t.error),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ── Scrollable content ───────────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Basic info ────────────────────────────────────
                      Text(
                        'Budget details',
                        style: AppTextStyles.caption(t.txtSecondary).copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AppInputField(
                              label: 'Budget name',
                              placeholder: 'e.g. Fixed Costs',
                              controller: _nameController,
                              textCapitalization: TextCapitalization.sentences,
                              onChanged: (_) => setState(() {}),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Recurrence',
                              style: AppTextStyles.caption(t.txtSecondary)
                                  .copyWith(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _kRecurrenceOptions.map((opt) {
                                final selected = _recurrence == opt;
                                return GestureDetector(
                                  onTap: () =>
                                      setState(() => _recurrence = opt),
                                  child: AnimatedContainer(
                                    duration:
                                        const Duration(milliseconds: 150),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: selected
                                          ? t.primary.withValues(
                                              alpha: t.isDark ? 0.2 : 0.1)
                                          : t.isDark
                                              ? Colors.white
                                                  .withValues(alpha: 0.05)
                                              : Colors.white
                                                  .withValues(alpha: 0.7),
                                      borderRadius: AppRadius.pillAll,
                                      border: Border.all(
                                        color: selected
                                            ? t.primary.withValues(
                                                alpha: t.isDark ? 0.55 : 0.4)
                                            : t.primary
                                                .withValues(alpha: 0.15),
                                        width: selected ? 1.5 : 1.0,
                                      ),
                                    ),
                                    child: Text(
                                      opt,
                                      style: AppTextStyles.bodySm(
                                        selected ? t.primary : t.txtSecondary,
                                      ).copyWith(
                                        fontSize: 13,
                                        fontWeight: selected
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Start day of month',
                              style: AppTextStyles.caption(t.txtSecondary)
                                  .copyWith(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              decoration: BoxDecoration(
                                color: t.isDark
                                    ? Colors.white.withValues(alpha: 0.04)
                                    : Colors.white.withValues(alpha: 0.7),
                                borderRadius: AppRadius.baseAll,
                                border: Border.all(
                                  color: t.isDark
                                      ? Colors.white.withValues(alpha: 0.07)
                                      : t.primary.withValues(alpha: 0.12),
                                ),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<int>(
                                  value: _startDay,
                                  isExpanded: true,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16),
                                  borderRadius: AppRadius.baseAll,
                                  dropdownColor: t.isDark
                                      ? const Color(0xFF1C1830)
                                      : Colors.white,
                                  icon: Text('▾',
                                      style: TextStyle(
                                          fontSize: 18,
                                          color: t.txtTertiary,
                                          height: 1)),
                                  style: AppTextStyles.body(t.txtPrimary)
                                      .copyWith(fontSize: 14),
                                  items: List.generate(31, (i) {
                                    final day = i + 1;
                                    return DropdownMenuItem(
                                      value: day,
                                      child: Text('Day $day',
                                          style: AppTextStyles.body(
                                                  t.txtPrimary)
                                              .copyWith(fontSize: 14)),
                                    );
                                  }),
                                  onChanged: (d) {
                                    if (d != null) {
                                      setState(() => _startDay = d);
                                    }
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Income areas ──────────────────────────────────
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Income areas',
                              style: AppTextStyles.caption(t.success).copyWith(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...incomeAreas.map((area) {
                        final i = _areas.indexOf(area);
                        return _EditAreaCard(
                          area: area,
                          onAddSubcategory: () => _showSubcategoryPicker(i),
                          onRemoveArea: () =>
                              setState(() => _areas.removeAt(i)),
                          onAmountChanged: () => setState(() {}),
                          onRemoveSubcategory: (subId) => setState(() {
                            area.subcategories
                                .removeWhere((s) => s.subcategoryId == subId);
                          }),
                        );
                      }),
                      GestureDetector(
                        onTap: () => _addArea('Income'),
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            borderRadius: AppRadius.lgAll,
                            border: Border.all(
                              color: t.success.withValues(alpha: 0.4),
                              width: 1.5,
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
                                style: AppTextStyles.body(t.success).copyWith(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Expense areas ─────────────────────────────────
                      Text(
                        'Expense areas',
                        style: AppTextStyles.caption(t.error).copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...expenseAreas.map((area) {
                        final i = _areas.indexOf(area);
                        return _EditAreaCard(
                          area: area,
                          onAddSubcategory: () => _showSubcategoryPicker(i),
                          onRemoveArea: () =>
                              setState(() => _areas.removeAt(i)),
                          onAmountChanged: () => setState(() {}),
                          onRemoveSubcategory: (subId) => setState(() {
                            area.subcategories
                                .removeWhere((s) => s.subcategoryId == subId);
                          }),
                        );
                      }),
                      GestureDetector(
                        onTap: () => _addArea('Expense'),
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            borderRadius: AppRadius.lgAll,
                            border: Border.all(
                              color: t.error.withValues(alpha: 0.4),
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('+',
                                  style: TextStyle(
                                      fontSize: 20,
                                      color: t.error,
                                      height: 1)),
                              const SizedBox(width: 6),
                              Text(
                                'Add Expense Area',
                                style: AppTextStyles.body(t.error).copyWith(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600),
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

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    _error!,
                    style:
                        AppTextStyles.bodySm(t.error).copyWith(fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
              Padding(
                padding:
                    EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: _isLoading ? 'Saving...' : 'Save Changes',
                  onPressed: (_isLoading || !_canSave) ? null : _save,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Edit Area Card ────────────────────────────────────────────────────────────

class _EditAreaCard extends StatefulWidget {
  final _EditDraftArea area;
  final VoidCallback onAddSubcategory;
  final VoidCallback onRemoveArea;
  final VoidCallback onAmountChanged;
  final void Function(int subId) onRemoveSubcategory;

  const _EditAreaCard({
    required this.area,
    required this.onAddSubcategory,
    required this.onRemoveArea,
    required this.onAmountChanged,
    required this.onRemoveSubcategory,
  });

  @override
  State<_EditAreaCard> createState() => _EditAreaCardState();
}

class _EditAreaCardState extends State<_EditAreaCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final area = widget.area;
    final isIncome = area.allocationType == 'Income';
    final accentColor = isIncome ? t.success : t.error;
    final prefix = isIncome ? '' : '- ';
    final total = area.totalCents;

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
                            area.name,
                            style: AppTextStyles.body(t.txtPrimary).copyWith(
                                fontWeight: FontWeight.w700, fontSize: 15),
                          ),
                          if (total > 0) ...[
                            const SizedBox(height: 2),
                            Text(
                              '$prefix${formatCurrency(total)}',
                              style: AppTextStyles.mono(accentColor,
                                      fontSize: 13)
                                  .copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onRemoveArea,
                      child: Text('×',
                          style:
                              TextStyle(fontSize: 22, color: t.error, height: 1)),
                    ),
                    const SizedBox(width: 6),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Text('▾',
                          style: TextStyle(
                              fontSize: 20, color: t.txtTertiary, height: 1)),
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              Divider(
                  height: 1,
                  thickness: 1,
                  color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5)),
              ...area.subcategories.map((sub) => _EditSubcategoryRow(
                    sub: sub,
                    accentColor: accentColor,
                    prefix: prefix,
                    onRemove: () =>
                        widget.onRemoveSubcategory(sub.subcategoryId),
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
                              fontSize: 18, color: accentColor, height: 1)),
                      const SizedBox(width: 6),
                      Text(
                        'Add Subcategory',
                        style: AppTextStyles.bodySm(accentColor)
                            .copyWith(
                                fontWeight: FontWeight.w500, fontSize: 13),
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

// ── Edit Subcategory Row ──────────────────────────────────────────────────────

class _EditSubcategoryRow extends StatefulWidget {
  final _EditDraftSubcategory sub;
  final Color accentColor;
  final String prefix;
  final VoidCallback onRemove;
  final VoidCallback onAmountChanged;

  const _EditSubcategoryRow({
    required this.sub,
    required this.accentColor,
    required this.prefix,
    required this.onRemove,
    required this.onAmountChanged,
  });

  @override
  State<_EditSubcategoryRow> createState() => _EditSubcategoryRowState();
}

class _EditSubcategoryRowState extends State<_EditSubcategoryRow> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final initialText = widget.sub.allocatedCents > 0
        ? const CentsInputFormatter()
            .formatEditUpdate(
              TextEditingValue.empty,
              TextEditingValue(
                  text: widget.sub.allocatedCents.toString()),
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
                      fontSize: 13, fontWeight: FontWeight.w500),
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
              Text(
                '${widget.prefix}R\$',
                style: AppTextStyles.caption(widget.accentColor)
                    .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
              ),
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
                style: TextStyle(fontSize: 20, color: t.error, height: 1)),
          ),
        ],
      ),
    );
  }
}

// ── Subcategory Picker Page ───────────────────────────────────────────────────

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
  State<_SubcategoryPickerPage> createState() =>
      _SubcategoryPickerPageState();
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
          Navigator.of(context).pop();
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
                            fontWeight: FontWeight.w700, fontSize: 17),
                      ),
                    ),
                    const SizedBox(width: 36),
                  ],
                ),
              ),
              const SizedBox(height: 12),
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
                        padding:
                            EdgeInsets.fromLTRB(16, 8, 16, bottomPad + 32),
                        children: filtered.map((cat) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding:
                                    const EdgeInsets.only(top: 16, bottom: 8),
                                child: Text(
                                  cat.name.toUpperCase(),
                                  style:
                                      AppTextStyles.caption(t.primary).copyWith(
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
                                      : Colors.white.withValues(alpha: 0.9),
                                  borderRadius: AppRadius.xlAll,
                                  border: Border.all(
                                    color: t.isDark
                                        ? Colors.white.withValues(alpha: 0.07)
                                        : t.primary.withValues(alpha: 0.12),
                                  ),
                                ),
                                child: Column(
                                  children: cat.subcategories
                                      .asMap()
                                      .entries
                                      .map((e) {
                                    final sub = e.value;
                                    final isLast =
                                        e.key == cat.subcategories.length - 1;
                                    final isUsed = widget.usedSubcategoryIds
                                        .contains(sub.id);
                                    return Column(
                                      children: [
                                        GestureDetector(
                                          behavior: HitTestBehavior.opaque,
                                          onTap: isUsed
                                              ? null
                                              : () => _showAmountSheet(sub),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 16, vertical: 14),
                                            child: Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    sub.name,
                                                    style: AppTextStyles.body(
                                                            isUsed
                                                                ? t.txtDisabled
                                                                : t.txtPrimary)
                                                        .copyWith(fontSize: 14),
                                                  ),
                                                ),
                                                if (isUsed)
                                                  Text(
                                                    'Added',
                                                    style: AppTextStyles
                                                        .caption(t.txtDisabled)
                                                        .copyWith(fontSize: 11),
                                                  )
                                                else
                                                  Icon(Icons.chevron_right,
                                                      size: 18,
                                                      color: t.txtDisabled),
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
                                                alpha:
                                                    t.isDark ? 0.2 : 0.4),
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
              style: AppTextStyles.body(t.txtPrimary)
                  .copyWith(fontWeight: FontWeight.w700, fontSize: 16),
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
                              t.primary.withValues(alpha: 0.35), fontSize: 32)
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
