import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../../categories/providers/subcategories_provider.dart';
import '../data/models/transaction_filter_state.dart';
import '../providers/areas_provider.dart';
import '../providers/transaction_filter_provider.dart';

class FilterSheet extends ConsumerStatefulWidget {
  const FilterSheet({super.key});

  @override
  ConsumerState<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<FilterSheet> {
  late TransactionFilterState _draft;

  @override
  void initState() {
    super.initState();
    _draft = ref.read(transactionFilterProvider);
  }

  void _apply() {
    final notifier = ref.read(transactionFilterProvider.notifier);
    notifier.updatePeriod(
      _draft.period,
      from: _draft.customFrom,
      to: _draft.customTo,
    );
    notifier.updateTypeFilter(_draft.typeFilter);
    notifier.updateAccount(_draft.accountId, _draft.accountName);
    notifier.updateSubCategory(_draft.subCategoryId, _draft.subCategoryName);
    notifier.updateArea(_draft.areaId, _draft.areaName);
    notifier.updateValueRange(_draft.minValueCents, _draft.maxValueCents);
    Navigator.of(context).pop();
  }

  void _clearAll() {
    setState(() {
      _draft = const TransactionFilterState();
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewInsetsOf(context).bottom +
        MediaQuery.viewPaddingOf(context).bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.9,
      ),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(AppRadius.xl3)),
      ),
      padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 24),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.mist,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Filtros',
                  style: AppTextStyles.h2(t.txtPrimary),
                ),
                GestureDetector(
                  onTap: _clearAll,
                  child: Text(
                    'Limpar tudo',
                    style: AppTextStyles.body(t.accent).copyWith(fontSize: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _SectionLabel(label: 'Período'),
            const SizedBox(height: 10),
            _PeriodSelector(
              selected: _draft.period,
              customFrom: _draft.customFrom,
              customTo: _draft.customTo,
              onChanged: (period, {from, to}) {
                setState(() {
                  _draft = _draft.copyWith(
                    period: period,
                    customFrom: from,
                    customTo: to,
                    clearCustomFrom: from == null,
                    clearCustomTo: to == null,
                  );
                });
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel(label: 'Tipo'),
            const SizedBox(height: 10),
            _TypeSelector(
              selected: _draft.typeFilter,
              onChanged: (type) {
                setState(() {
                  _draft = _draft.copyWith(
                    typeFilter: type,
                    clearTypeFilter: type == null,
                  );
                });
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel(label: 'Conta'),
            const SizedBox(height: 10),
            _AccountSelector(
              selectedId: _draft.accountId,
              selectedName: _draft.accountName,
              onChanged: (id, name) {
                setState(() {
                  _draft = _draft.copyWith(
                    accountId: id,
                    accountName: name,
                    clearAccount: id == null,
                  );
                });
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel(label: 'Subcategoria'),
            const SizedBox(height: 10),
            _SubcategorySelector(
              selectedId: _draft.subCategoryId,
              selectedName: _draft.subCategoryName,
              onChanged: (id, name) {
                setState(() {
                  _draft = _draft.copyWith(
                    subCategoryId: id,
                    subCategoryName: name,
                    clearSubCategory: id == null,
                  );
                });
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel(label: 'Área'),
            const SizedBox(height: 10),
            _AreaSelector(
              selectedId: _draft.areaId,
              selectedName: _draft.areaName,
              onChanged: (id, name) {
                setState(() {
                  _draft = _draft.copyWith(
                    areaId: id,
                    areaName: name,
                    clearArea: id == null,
                  );
                });
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel(label: 'Faixa de valor'),
            const SizedBox(height: 10),
            _ValueRangeSelector(
              minCents: _draft.minValueCents,
              maxCents: _draft.maxValueCents,
              onChanged: (min, max) {
                setState(() {
                  _draft = _draft.copyWith(
                    minValueCents: min,
                    maxValueCents: max,
                    clearMinValue: min == null,
                    clearMaxValue: max == null,
                  );
                });
              },
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: PrimaryButton(label: 'Aplicar', onPressed: _apply),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section label ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Text(
      label.toUpperCase(),
      style: AppTextStyles.eyebrow(t.txtSecondary),
    );
  }
}

// ── Period selector ───────────────────────────────────────────────────────────

typedef _PeriodChanged = void Function(
  TransactionPeriod period, {
  DateTime? from,
  DateTime? to,
});

class _PeriodSelector extends StatelessWidget {
  final TransactionPeriod selected;
  final DateTime? customFrom;
  final DateTime? customTo;
  final _PeriodChanged onChanged;

  const _PeriodSelector({
    required this.selected,
    required this.customFrom,
    required this.customTo,
    required this.onChanged,
  });

  static const _options = [
    (TransactionPeriod.currentBudget, 'Orçamento atual'),
    (TransactionPeriod.last7Days, 'Últimos 7 dias'),
    (TransactionPeriod.last15Days, 'Últimos 15 dias'),
    (TransactionPeriod.lastMonth, 'Último mês'),
    (TransactionPeriod.last3Months, 'Últimos 3 meses'),
    (TransactionPeriod.last6Months, 'Últimos 6 meses'),
    (TransactionPeriod.last365Days, 'Último ano'),
    (TransactionPeriod.custom, 'Período personalizado'),
  ];

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (period, label) in _options)
          GestureDetector(
            onTap: () async {
              if (period == TransactionPeriod.custom) {
                final range = await showDateRangePicker(
                  context: context,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                  initialDateRange: (customFrom != null && customTo != null)
                      ? DateTimeRange(start: customFrom!, end: customTo!)
                      : null,
                );
                if (range != null) {
                  onChanged(period, from: range.start, to: range.end);
                }
              } else {
                onChanged(period);
              }
            },
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected == period
                    ? t.accent.withValues(alpha: t.isDark ? 0.22 : 0.12)
                    : t.surfaceEl,
                borderRadius: AppRadius.mdAll,
                border: Border.all(
                  color: selected == period ? t.accent : t.mist,
                  width: 1.5,
                ),
              ),
              child: Text(
                selected == period &&
                        period == TransactionPeriod.custom &&
                        customFrom != null &&
                        customTo != null
                    ? '${fmt.formatDate(customFrom!)} – ${fmt.formatDate(customTo!)}'
                    : label,
                style: AppTextStyles.body(
                  selected == period ? t.accent : t.txtSecondary,
                ).copyWith(fontSize: 13),
              ),
            ),
          ),
      ],
    );
  }
}

// ── Type selector ─────────────────────────────────────────────────────────────

class _TypeSelector extends StatelessWidget {
  final String? selected;
  final ValueChanged<String?> onChanged;

  const _TypeSelector({required this.selected, required this.onChanged});

  static const _options = [
    (null, 'Todas'),
    ('Expense', 'Despesas'),
    ('Income', 'Receitas'),
    ('Recurring', 'Recorrentes'),
  ];

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        for (final (value, label) in _options) ...[
          GestureDetector(
            onTap: () => onChanged(value),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected == value
                    ? t.accent.withValues(alpha: t.isDark ? 0.22 : 0.12)
                    : t.surfaceEl,
                borderRadius: AppRadius.mdAll,
                border: Border.all(
                  color: selected == value ? t.accent : t.mist,
                  width: 1.5,
                ),
              ),
              child: Text(
                label,
                style: AppTextStyles.body(
                  selected == value ? t.accent : t.txtSecondary,
                ).copyWith(fontSize: 13),
              ),
            ),
          ),
          if (value != 'Recurring') const SizedBox(width: 8),
        ],
      ],
    );
  }
}

// ── Account selector ──────────────────────────────────────────────────────────

class _AccountSelector extends ConsumerWidget {
  final int? selectedId;
  final String? selectedName;
  final void Function(int? id, String? name) onChanged;

  const _AccountSelector({
    required this.selectedId,
    required this.selectedName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountsAsync = ref.watch(accountsNotifierProvider);
    final t = AppThemeTokens.of(context);

    return accountsAsync.when(
      loading: () => const SizedBox(height: 36, child: LinearProgressIndicator()),
      error: (e, st) => const SizedBox.shrink(),
      data: (accounts) => _PickerRow(
        label: selectedName ?? 'Todas as contas',
        isSelected: selectedId != null,
        onTap: () => _showPicker(
          context,
          t,
          items: accounts.map((a) => (a.id, a.name)).toList(),
          selectedId: selectedId,
          onSelect: (id, name) => onChanged(id, name),
          onClear: () => onChanged(null, null),
        ),
      ),
    );
  }
}

// ── Subcategory selector ──────────────────────────────────────────────────────

class _SubcategorySelector extends ConsumerWidget {
  final int? selectedId;
  final String? selectedName;
  final void Function(int? id, String? name) onChanged;

  const _SubcategorySelector({
    required this.selectedId,
    required this.selectedName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(subcategoriesNotifierProvider);
    final t = AppThemeTokens.of(context);

    return subsAsync.when(
      loading: () => const SizedBox(height: 36, child: LinearProgressIndicator()),
      error: (_, __) => const SizedBox.shrink(),
      data: (subs) => _PickerRow(
        label: selectedName ?? 'Todas as subcategorias',
        isSelected: selectedId != null,
        onTap: () => _showPicker(
          context,
          t,
          items: subs.map((s) => (s.id, s.name)).toList(),
          selectedId: selectedId,
          onSelect: (id, name) => onChanged(id, name),
          onClear: () => onChanged(null, null),
        ),
      ),
    );
  }
}

// ── Area selector ─────────────────────────────────────────────────────────────

class _AreaSelector extends ConsumerWidget {
  final int? selectedId;
  final String? selectedName;
  final void Function(int? id, String? name) onChanged;

  const _AreaSelector({
    required this.selectedId,
    required this.selectedName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final areasAsync = ref.watch(areasProvider);
    final t = AppThemeTokens.of(context);

    return areasAsync.when(
      loading: () => const SizedBox(height: 36, child: LinearProgressIndicator()),
      error: (_, __) => const SizedBox.shrink(),
      data: (areas) => _PickerRow(
        label: selectedName ?? 'Todas as áreas',
        isSelected: selectedId != null,
        onTap: () => _showPicker(
          context,
          t,
          items: areas.map((a) => (a.id, a.name)).toList(),
          selectedId: selectedId,
          onSelect: (id, name) => onChanged(id, name),
          onClear: () => onChanged(null, null),
        ),
      ),
    );
  }
}

// ── Value range selector ──────────────────────────────────────────────────────

class _ValueRangeSelector extends StatefulWidget {
  final int? minCents;
  final int? maxCents;
  final void Function(int? min, int? max) onChanged;

  const _ValueRangeSelector({
    required this.minCents,
    required this.maxCents,
    required this.onChanged,
  });

  @override
  State<_ValueRangeSelector> createState() => _ValueRangeSelectorState();
}

class _ValueRangeSelectorState extends State<_ValueRangeSelector> {
  late final TextEditingController _minCtrl;
  late final TextEditingController _maxCtrl;

  @override
  void initState() {
    super.initState();
    _minCtrl = TextEditingController(
      text: widget.minCents != null
          ? (widget.minCents! / 100).toStringAsFixed(2)
          : '',
    );
    _maxCtrl = TextEditingController(
      text: widget.maxCents != null
          ? (widget.maxCents! / 100).toStringAsFixed(2)
          : '',
    );
  }

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  void _notify() {
    final min = double.tryParse(_minCtrl.text.replaceAll(',', '.'));
    final max = double.tryParse(_maxCtrl.text.replaceAll(',', '.'));
    widget.onChanged(
      min != null ? (min * 100).round() : null,
      max != null ? (max * 100).round() : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fieldDecoration = InputDecoration(
      hintStyle: AppTextStyles.body(t.txtTertiary).copyWith(fontSize: 14),
      filled: true,
      fillColor: t.surfaceEl,
      border: OutlineInputBorder(
        borderRadius: AppRadius.baseAll,
        borderSide: BorderSide(color: t.mist),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadius.baseAll,
        borderSide: BorderSide(color: t.mist),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadius.baseAll,
        borderSide: BorderSide(color: t.accent, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      isDense: true,
    );

    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _minCtrl,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => _notify(),
            style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
            decoration: fieldDecoration.copyWith(hintText: 'Mín (R\$)'),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text('–', style: AppTextStyles.body(t.txtTertiary)),
        ),
        Expanded(
          child: TextField(
            controller: _maxCtrl,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => _notify(),
            style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
            decoration: fieldDecoration.copyWith(hintText: 'Máx (R\$)'),
          ),
        ),
      ],
    );
  }
}

// ── Shared picker row ─────────────────────────────────────────────────────────

class _PickerRow extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PickerRow({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? t.accent.withValues(alpha: t.isDark ? 0.16 : 0.10)
              : t.surfaceEl,
          borderRadius: AppRadius.baseAll,
          border: Border.all(
            color: isSelected ? t.accent : t.mist,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.body(
                  isSelected ? t.accent : t.txtSecondary,
                ).copyWith(fontSize: 14),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: t.txtTertiary,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Generic item picker bottom sheet ─────────────────────────────────────────

void _showPicker(
  BuildContext context,
  AppThemeTokens t, {
  required List<(int, String)> items,
  required int? selectedId,
  required void Function(int id, String name) onSelect,
  required VoidCallback onClear,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ItemPickerSheet(
      items: items,
      selectedId: selectedId,
      onSelect: onSelect,
      onClear: onClear,
    ),
  );
}

class _ItemPickerSheet extends StatefulWidget {
  final List<(int, String)> items;
  final int? selectedId;
  final void Function(int id, String name) onSelect;
  final VoidCallback onClear;

  const _ItemPickerSheet({
    required this.items,
    required this.selectedId,
    required this.onSelect,
    required this.onClear,
  });

  @override
  State<_ItemPickerSheet> createState() => _ItemPickerSheetState();
}

class _ItemPickerSheetState extends State<_ItemPickerSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    final filtered = widget.items
        .where(
            (item) => item.$2.toLowerCase().contains(_query.toLowerCase()))
        .toList();

    return Container(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(AppRadius.xl3)),
      ),
      padding: EdgeInsets.fromLTRB(16, 16, 16, bottomPad + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: t.mist,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            autofocus: true,
            onChanged: (v) => setState(() => _query = v),
            decoration: InputDecoration(
              hintText: 'Buscar...',
              hintStyle:
                  AppTextStyles.body(t.txtTertiary).copyWith(fontSize: 14),
              prefixIcon:
                  Icon(Icons.search_rounded, size: 20, color: t.txtTertiary),
              filled: true,
              fillColor: t.surfaceEl,
              border: OutlineInputBorder(
                borderRadius: AppRadius.baseAll,
                borderSide: BorderSide(color: t.mist),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: AppRadius.baseAll,
                borderSide: BorderSide(color: t.mist),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: AppRadius.baseAll,
                borderSide: BorderSide(color: t.accent, width: 1.5),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              isDense: true,
            ),
          ),
          const SizedBox(height: 8),
          if (widget.selectedId != null)
            ListTile(
              dense: true,
              title: Text(
                'Limpar seleção',
                style:
                    AppTextStyles.body(t.error).copyWith(fontSize: 14),
              ),
              leading:
                  Icon(Icons.close_rounded, size: 18, color: t.error),
              onTap: () {
                widget.onClear();
                Navigator.of(context).pop();
              },
            ),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * 0.45,
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final (id, name) = filtered[index];
                final isSelected = id == widget.selectedId;
                return ListTile(
                  dense: true,
                  title: Text(
                    name,
                    style: AppTextStyles.body(
                      isSelected ? t.accent : t.txtPrimary,
                    ).copyWith(fontSize: 14),
                  ),
                  trailing: isSelected
                      ? Icon(Icons.check_rounded, size: 18, color: t.accent)
                      : null,
                  onTap: () {
                    widget.onSelect(id, name);
                    Navigator.of(context).pop();
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
