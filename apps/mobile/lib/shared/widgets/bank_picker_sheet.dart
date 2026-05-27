import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import '../../features/accounts/providers/banks_provider.dart';
import 'app_widgets.dart';

/// Shows a bottom sheet with a searchable list of banks.
/// Returns the selected bank name, or null if dismissed.
Future<String?> showBankPickerSheet(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _BankPickerSheet(),
  );
}

class _BankPickerSheet extends ConsumerStatefulWidget {
  const _BankPickerSheet();

  @override
  ConsumerState<_BankPickerSheet> createState() => _BankPickerSheetState();
}

class _BankPickerSheetState extends ConsumerState<_BankPickerSheet> {
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
    final banksAsync = ref.watch(banksProvider);
    final screenHeight = MediaQuery.sizeOf(context).height;

    return Container(
      height: screenHeight * 0.65,
      decoration: BoxDecoration(
        color: t.isDark ? const Color(0xFF13102B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Handle ─────────────────────────────────────────────────────
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 16),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: t.divider.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // ── Title ──────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text('Select bank', style: AppTextStyles.h3(t.txtPrimary)),
          ),
          const SizedBox(height: 14),

          // ── Search ─────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: AppInputField(
              placeholder: 'Search bank...',
              controller: _searchController,
              leftIcon: Icon(LucideIcons.search, size: 16, color: t.txtTertiary),
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
            ),
          ),
          const SizedBox(height: 12),

          // ── List ───────────────────────────────────────────────────────
          Expanded(
            child: banksAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              error: (_, __) => Center(
                child: Text(
                  'Could not load banks.',
                  style: AppTextStyles.body(t.error),
                ),
              ),
              data: (banks) {
                final filtered = _query.isEmpty
                    ? banks
                    : banks
                        .where((b) => b.toLowerCase().contains(_query))
                        .toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Text(
                      'No banks found.',
                      style: AppTextStyles.body(t.txtSecondary),
                    ),
                  );
                }

                return ListView.separated(
                  padding: AppSpacing.screenPadding.copyWith(top: 0),
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => Divider(
                    height: 1,
                    thickness: 1,
                    color: t.divider.withValues(alpha: 0.3),
                  ),
                  itemBuilder: (_, i) {
                    final bank = filtered[i];
                    return GestureDetector(
                      onTap: () => Navigator.of(context).pop(bank),
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: t.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                LucideIcons.landmark,
                                size: 16,
                                color: t.primary,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Text(
                              bank,
                              style: AppTextStyles.body(t.txtPrimary)
                                  .copyWith(fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),

          SizedBox(height: MediaQuery.viewPaddingOf(context).bottom + 12),
        ],
      ),
    );
  }
}
