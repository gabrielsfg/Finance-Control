import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/account_visuals.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/data/models/account.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../../budgets/providers/budget_provider.dart';
import '../../home/providers/home_provider.dart';
import '../../transactions/providers/transaction_feed_provider.dart';
import '../data/import_models.dart';
import '../providers/import_flow_provider.dart';
import 'import_row_sheet.dart';

/// File types the API's parser understands.
const _allowedExtensions = ['ofx', 'csv'];

// ── Page ───────────────────────────────────────────────────────────────────

class ImportPage extends ConsumerWidget {
  const ImportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final state = ref.watch(importFlowProvider);

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                PageHeader(
                  eyebrow: 'EXTRATO',
                  title: 'Importar',
                  showBack: true,
                  onBack: () => context.pop(),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: switch (state.step) {
                    ImportStep.upload => const _UploadStep(),
                    ImportStep.review => const _ReviewStep(),
                    ImportStep.done => const _DoneStep(),
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Step 1 — file and account ──────────────────────────────────────────────

class _UploadStep extends ConsumerWidget {
  const _UploadStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final state = ref.watch(importFlowProvider);
    final notifier = ref.read(importFlowProvider.notifier);
    final accounts = ref.watch(accountsNotifierProvider).valueOrNull ?? [];
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Column(
      children: [
        Expanded(
          child: ListView(
            children: [
              Text(
                'Envie o extrato do banco ou a fatura do cartão em OFX ou CSV. Você revisa tudo antes de qualquer coisa entrar na sua conta.',
                style: AppTextStyles.bodySm(t.txtSecondary),
              ),
              const SizedBox(height: 20),
              const _FieldLabel('CONTA DE DESTINO'),
              const SizedBox(height: 8),
              _SelectorTile(
                icon: LucideIcons.wallet,
                label: state.accountName ?? 'Escolher conta',
                isPlaceholder: state.accountName == null,
                onTap: () => _openAccountPicker(context, ref, accounts),
              ),
              const SizedBox(height: 20),
              const _FieldLabel('ARQUIVO'),
              const SizedBox(height: 8),
              _SelectorTile(
                icon: LucideIcons.fileText,
                label: state.fileName ?? 'Escolher arquivo (.ofx ou .csv)',
                isPlaceholder: state.fileName == null,
                onTap: () => _pickFile(ref),
              ),
              const SizedBox(height: 20),
              GlassCard(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Contar no orçamento',
                            style: AppTextStyles.body(t.txtPrimary).copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Inclui as transações importadas no orçamento do período',
                            style: AppTextStyles.caption(t.txtTertiary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Switch(
                      value: state.countForBudget,
                      onChanged: notifier.setCountForBudget,
                      activeThumbColor: t.primary,
                    ),
                  ],
                ),
              ),
              if (state.error != null) ...[
                const SizedBox(height: 16),
                AppErrorBanner(message: state.error!),
              ],
            ],
          ),
        ),
        Padding(
          padding: EdgeInsets.only(top: 12, bottom: bottomPad + 16),
          child: SizedBox(
            width: double.infinity,
            child: state.isBusy
                ? const Center(child: CircularProgressIndicator())
                : PrimaryButton(
                    label: 'Analisar arquivo',
                    onPressed: state.canParse ? notifier.parse : null,
                  ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickFile(WidgetRef ref) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: _allowedExtensions,
    );

    final file = result?.files.singleOrNull;
    final path = file?.path;
    if (file == null || path == null) return;

    ref.read(importFlowProvider.notifier).selectFile(path, file.name);
  }

  void _openAccountPicker(
    BuildContext context,
    WidgetRef ref,
    List<Account> accounts,
  ) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _AccountPickerSheet(
        accounts: accounts,
        selectedId: ref.read(importFlowProvider).accountId,
        onSelected: (account) => ref
            .read(importFlowProvider.notifier)
            .selectAccount(account.id, account.name),
      ),
    );
  }
}

// ── Step 2 — review ────────────────────────────────────────────────────────

class _ReviewStep extends ConsumerWidget {
  const _ReviewStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final state = ref.watch(importFlowProvider);
    final notifier = ref.read(importFlowProvider.notifier);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final selected = state.selectedCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                state.duplicatesFound > 0
                    ? '${state.rows.length} transações · ${state.duplicatesFound} já existentes'
                    : '${state.rows.length} transações encontradas',
                style: AppTextStyles.bodySm(t.txtSecondary),
              ),
            ),
            GestureDetector(
              onTap: notifier.toggleAll,
              behavior: HitTestBehavior.opaque,
              child: Text(
                state.allSelected ? 'Desmarcar todas' : 'Marcar todas',
                style: AppTextStyles.bodySm(t.accent)
                    .copyWith(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.separated(
            itemCount: state.rows.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, index) => _RowCard(
              row: state.rows[index],
              onToggle: () => notifier.toggleRow(index),
              onEdit: () => _openRowSheet(context, ref, index),
            ),
          ),
        ),
        if (state.error != null) ...[
          const SizedBox(height: 12),
          AppErrorBanner(message: state.error!),
        ],
        Padding(
          padding: EdgeInsets.only(top: 12, bottom: bottomPad + 16),
          child: SizedBox(
            width: double.infinity,
            child: state.isBusy
                ? const Center(child: CircularProgressIndicator())
                : PrimaryButton(
                    label: selected == 1
                        ? 'Importar 1 transação'
                        : 'Importar $selected transações',
                    onPressed:
                        selected == 0 ? null : () => _confirm(ref, notifier),
                  ),
          ),
        ),
      ],
    );
  }

  /// Invalidates as soon as the import lands rather than when the user leaves
  /// the last step: they may well walk out with the system back gesture, and
  /// the feed behind this screen would still be showing the old month.
  Future<void> _confirm(WidgetRef ref, ImportFlowNotifier notifier) async {
    await notifier.confirm();
    if (ref.read(importFlowProvider).step != ImportStep.done) return;

    ref.invalidate(transactionFeedProvider);
    ref.invalidate(homeNotifierProvider);
    ref.invalidate(accountsNotifierProvider);
    ref.invalidate(budgetNotifierProvider);
  }

  void _openRowSheet(BuildContext context, WidgetRef ref, int index) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => Consumer(
        builder: (_, innerRef, _) {
          final row = innerRef.watch(importFlowProvider).rows[index];
          final notifier = innerRef.read(importFlowProvider.notifier);
          return ImportRowSheet(
            row: row,
            onTypeChanged: (type) => notifier.setRowType(index, type),
            onSubcategoryChanged: (id, name) =>
                notifier.setRowSubcategory(index, id, name),
          );
        },
      ),
    );
  }
}

// ── Step 3 — result ────────────────────────────────────────────────────────

class _DoneStep extends ConsumerWidget {
  const _DoneStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final count = ref.watch(importFlowProvider).importedCount;
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Column(
      children: [
        Expanded(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: t.moss.withValues(alpha: t.isDark ? 0.18 : 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(LucideIcons.check, size: 30, color: t.moss),
                ),
                const SizedBox(height: 18),
                Text(
                  count == 1
                      ? '1 transação importada'
                      : '$count transações importadas',
                  style: AppTextStyles.h3(t.txtPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  'Elas já aparecem no seu extrato.',
                  style: AppTextStyles.bodySm(t.txtTertiary),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.only(bottom: bottomPad + 16),
          child: SizedBox(
            width: double.infinity,
            child: PrimaryButton(
              label: 'Ver no extrato',
              onPressed: () => context.pop(),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Row card ───────────────────────────────────────────────────────────────

class _RowCard extends StatelessWidget {
  const _RowCard({
    required this.row,
    required this.onToggle,
    required this.onEdit,
  });

  final ImportRow row;
  final VoidCallback onToggle;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final isExpense = row.type == 'Expense';

    return GlassCard(
      onTap: onEdit,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      color: row.selected ? null : t.bg,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onToggle,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              // Widens the tap target without moving the box off the baseline.
              padding: const EdgeInsets.only(right: 12, top: 2, bottom: 6),
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: row.selected ? t.primary : Colors.transparent,
                  borderRadius: AppRadius.smAll,
                  border: Border.all(
                    color: row.selected ? t.primary : t.mist,
                    width: 1.5,
                  ),
                ),
                child: row.selected
                    ? const Icon(LucideIcons.check,
                        size: 14, color: Colors.white)
                    : null,
              ),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        row.parsed.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Money(
                      isExpense ? -row.parsed.value : row.parsed.value,
                      size: 14,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      fmt.formatDate(row.parsed.date),
                      style: AppTextStyles.caption(t.txtTertiary),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        row.subCategoryName ?? 'Sem categoria',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.caption(
                          row.subCategoryName == null
                              ? t.gold
                              : t.txtSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                if (row.parsed.isDuplicate) ...[
                  const SizedBox(height: 8),
                  TonalTag('Já existe', color: t.gold),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared bits ────────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Text(label, style: AppTextStyles.eyebrow(t.txtSecondary));
  }
}

class _SelectorTile extends StatelessWidget {
  const _SelectorTile({
    required this.icon,
    required this.label,
    required this.isPlaceholder,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isPlaceholder;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: t.mist),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: t.txtTertiary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.body(
                  isPlaceholder ? t.txtTertiary : t.txtPrimary,
                ).copyWith(fontSize: 14),
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 18, color: t.txtTertiary),
          ],
        ),
      ),
    );
  }
}

class _AccountPickerSheet extends StatelessWidget {
  const _AccountPickerSheet({
    required this.accounts,
    required this.selectedId,
    required this.onSelected,
  });

  final List<Account> accounts;
  final int? selectedId;
  final ValueChanged<Account> onSelected;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.7,
      ),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.xl3),
        ),
        border: Border.all(color: t.mist),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, bottomPad + 20),
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
          Text('Conta de destino', style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 12),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: accounts.length,
              itemBuilder: (_, index) {
                final account = accounts[index];
                final isSelected = account.id == selectedId;

                return GestureDetector(
                  onTap: () {
                    onSelected(account);
                    Navigator.of(context).pop();
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Row(
                      children: [
                        Icon(
                          accountTypeIcon(account.type),
                          size: 19,
                          color: isSelected ? t.accent : t.txtTertiary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                account.name,
                                style: AppTextStyles.body(
                                  isSelected ? t.accent : t.txtPrimary,
                                ).copyWith(fontSize: 14),
                              ),
                              Text(
                                accountTypeLabel(account.type),
                                style: AppTextStyles.caption(t.txtTertiary),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          Icon(LucideIcons.check, size: 17, color: t.accent),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
