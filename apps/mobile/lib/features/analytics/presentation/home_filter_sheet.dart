import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../providers/home_filter_provider.dart';

class HomeFilterSheet extends ConsumerStatefulWidget {
  const HomeFilterSheet({super.key});

  @override
  ConsumerState<HomeFilterSheet> createState() => _HomeFilterSheetState();
}

class _HomeFilterSheetState extends ConsumerState<HomeFilterSheet> {
  late DateTime _startDate;
  late DateTime _endDate;

  @override
  void initState() {
    super.initState();
    final filter = ref.read(homeFilterProvider);
    _startDate = filter.startDate;
    _endDate = filter.endDate;
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bg = t.isDark ? const Color(0xFF1A1730) : Colors.white;

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 16, 24, MediaQuery.viewInsetsOf(context).bottom + 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: t.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('Filter', style: AppTextStyles.h2(t.txtPrimary)),
          const SizedBox(height: 24),
          Text(
            'PERIOD',
            style: AppTextStyles.caption(t.txtTertiary).copyWith(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 12),
          _QuickPeriods(
            selected: _startDate,
            onSelected: (start, end) =>
                setState(() { _startDate = start; _endDate = end; }),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _DateButton(
                  label: 'From',
                  date: _startDate,
                  onTap: () => _pickDate(context, isStart: true),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _DateButton(
                  label: 'To',
                  date: _endDate,
                  onTap: () => _pickDate(context, isStart: false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            label: 'Apply',
            onPressed: _apply,
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context, {required bool isStart}) async {
    final initial = isStart ? _startDate : _endDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_endDate.isBefore(_startDate)) _endDate = _startDate;
      } else {
        _endDate = picked;
        if (_startDate.isAfter(_endDate)) _startDate = _endDate;
      }
    });
  }

  void _apply() {
    ref
        .read(homeFilterProvider.notifier)
        .setPeriod(_startDate, _endDate);
    Navigator.of(context).pop();
  }
}

class _QuickPeriods extends StatelessWidget {
  const _QuickPeriods({required this.selected, required this.onSelected});

  final DateTime selected;
  final void Function(DateTime start, DateTime end) onSelected;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final periods = [
      ('This month', DateTime(now.year, now.month, 1),
          DateTime(now.year, now.month + 1, 0)),
      ('Last month', DateTime(now.year, now.month - 1, 1),
          DateTime(now.year, now.month, 0)),
      ('Last 3M', DateTime(now.year, now.month - 3, 1),
          DateTime(now.year, now.month + 1, 0)),
      ('This year', DateTime(now.year, 1, 1), DateTime(now.year, 12, 31)),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: periods.map((p) {
          final (label, start, end) = p;
          final isActive = selected.year == start.year &&
              selected.month == start.month &&
              selected.day == start.day;
          return _QuickChip(
            label: label,
            active: isActive,
            onTap: () => onSelected(start, end),
          );
        }).toList(),
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip(
      {required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: active ? t.primary : Colors.transparent,
          borderRadius: AppRadius.smAll,
          border: Border.all(
            color: active ? t.primary : t.divider,
          ),
        ),
        child: Text(
          label,
          style: AppTextStyles.bodySm(
            active ? Colors.white : t.txtSecondary,
          ).copyWith(fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}

class _DateButton extends StatelessWidget {
  const _DateButton(
      {required this.label, required this.date, required this.onTap});

  final String label;
  final DateTime date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final dateStr =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: t.divider),
          borderRadius: AppRadius.smAll,
        ),
        child: Row(
          children: [
            Icon(LucideIcons.calendar, size: 14, color: t.txtTertiary),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTextStyles.caption(t.txtTertiary)
                      .copyWith(fontSize: 10),
                ),
                Text(dateStr, style: AppTextStyles.bodySm(t.txtPrimary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
