import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/import_models.dart';
import '../data/import_repository.dart';

/// Where the user is in the import: pick a file, review what came out of it,
/// or read the result.
enum ImportStep { upload, review, done }

class ImportFlowState {
  const ImportFlowState({
    this.step = ImportStep.upload,
    this.accountId,
    this.accountName,
    this.countForBudget = true,
    this.filePath,
    this.fileName,
    this.rows = const [],
    this.duplicatesFound = 0,
    this.importedCount = 0,
    this.isBusy = false,
    this.error,
  });

  final ImportStep step;
  final int? accountId;
  final String? accountName;
  final bool countForBudget;
  final String? filePath;
  final String? fileName;
  final List<ImportRow> rows;
  final int duplicatesFound;
  final int importedCount;
  final bool isBusy;
  final String? error;

  bool get canParse => accountId != null && filePath != null && !isBusy;
  int get selectedCount => rows.where((r) => r.selected).length;
  bool get allSelected => rows.isNotEmpty && rows.every((r) => r.selected);

  ImportFlowState copyWith({
    ImportStep? step,
    int? accountId,
    String? accountName,
    bool? countForBudget,
    String? filePath,
    String? fileName,
    List<ImportRow>? rows,
    int? duplicatesFound,
    int? importedCount,
    bool? isBusy,
    String? error,
    bool clearError = false,
  }) =>
      ImportFlowState(
        step: step ?? this.step,
        accountId: accountId ?? this.accountId,
        accountName: accountName ?? this.accountName,
        countForBudget: countForBudget ?? this.countForBudget,
        filePath: filePath ?? this.filePath,
        fileName: fileName ?? this.fileName,
        rows: rows ?? this.rows,
        duplicatesFound: duplicatesFound ?? this.duplicatesFound,
        importedCount: importedCount ?? this.importedCount,
        isBusy: isBusy ?? this.isBusy,
        error: clearError ? null : (error ?? this.error),
      );
}

/// Auto-disposed: the flow is scoped to the screen, and leaving it half-way
/// should not leave a parsed file waiting in memory for the next visit.
final importFlowProvider =
    NotifierProvider.autoDispose<ImportFlowNotifier, ImportFlowState>(
  ImportFlowNotifier.new,
);

class ImportFlowNotifier extends AutoDisposeNotifier<ImportFlowState> {
  @override
  ImportFlowState build() => const ImportFlowState();

  void selectAccount(int id, String name) => state = state.copyWith(
        accountId: id,
        accountName: name,
        clearError: true,
      );

  void setCountForBudget(bool value) =>
      state = state.copyWith(countForBudget: value);

  void selectFile(String path, String name) => state = state.copyWith(
        filePath: path,
        fileName: name,
        clearError: true,
      );

  Future<void> parse() async {
    final accountId = state.accountId;
    final path = state.filePath;
    final name = state.fileName;
    if (accountId == null || path == null || name == null) return;

    state = state.copyWith(isBusy: true, clearError: true);
    try {
      final parsed = await ref.read(importRepositoryProvider).parseFile(
            filePath: path,
            fileName: name,
            accountId: accountId,
          );

      if (parsed.transactions.isEmpty) {
        state = state.copyWith(
          isBusy: false,
          error: 'Nenhuma transação foi encontrada nesse arquivo.',
        );
        return;
      }

      state = state.copyWith(
        isBusy: false,
        step: ImportStep.review,
        rows: parsed.transactions.map(ImportRow.from).toList(),
        duplicatesFound: parsed.duplicatesFound,
      );
    } catch (_) {
      state = state.copyWith(
        isBusy: false,
        error: 'Não foi possível ler o arquivo. Envie um OFX ou CSV válido.',
      );
    }
  }

  void toggleRow(int index) => _replaceRow(
        index,
        (row) => row.copyWith(selected: !row.selected),
      );

  void toggleAll() {
    final selectAll = !state.allSelected;
    state = state.copyWith(
      rows: [
        for (final row in state.rows) row.copyWith(selected: selectAll),
      ],
    );
  }

  void setRowSubcategory(int index, int? id, String? name) => _replaceRow(
        index,
        // copyWith cannot clear a value, so a cleared subcategory rebuilds the
        // row instead of going through it.
        (row) => id == null
            ? ImportRow(
                parsed: row.parsed,
                selected: row.selected,
                subCategoryId: null,
                subCategoryName: null,
                type: row.type,
              )
            : row.copyWith(subCategoryId: id, subCategoryName: name),
      );

  void setRowType(int index, String type) =>
      _replaceRow(index, (row) => row.copyWith(type: type));

  Future<void> confirm() async {
    final accountId = state.accountId;
    final selected = state.rows.where((r) => r.selected).toList();
    if (accountId == null || selected.isEmpty) return;

    state = state.copyWith(isBusy: true, clearError: true);
    try {
      final imported = await ref.read(importRepositoryProvider).confirmImport(
            ImportTransactionsRequest(
              accountId: accountId,
              countForBudget: state.countForBudget,
              transactions: selected.map((r) => r.toRequestItem()).toList(),
            ),
          );
      state = state.copyWith(
        isBusy: false,
        step: ImportStep.done,
        importedCount: imported,
      );
    } catch (_) {
      state = state.copyWith(
        isBusy: false,
        error: 'Não foi possível importar. Tente novamente.',
      );
    }
  }

  void _replaceRow(int index, ImportRow Function(ImportRow row) update) {
    final rows = [...state.rows];
    if (index < 0 || index >= rows.length) return;
    rows[index] = update(rows[index]);
    state = state.copyWith(rows: rows);
  }
}
