import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../accounts/providers/accounts_provider.dart';
import '../../budgets/providers/budget_provider.dart';
import '../../home/providers/home_provider.dart';
import '../data/dtos/create_transaction_request_dto.dart';
import '../data/dtos/create_transaction_response_dto.dart';
import '../data/dtos/update_recurring_request_dto.dart';
import '../data/dtos/update_transaction_request_dto.dart';
import '../data/models/transaction_item.dart';
import '../data/transaction_repository.dart';

// ---------------------------------------------------------------------------
// Transactions list
// ---------------------------------------------------------------------------

class TransactionsNotifier extends AsyncNotifier<List<TransactionItem>> {
  @override
  Future<List<TransactionItem>> build() async {
    final dtos = await ref
        .read(transactionRepositoryProvider)
        .getAllTransactions();
    return dtos.map(TransactionItem.fromDto).toList();
  }

  Future<void> deleteTransaction(int id) async {
    final dtos = await ref
        .read(transactionRepositoryProvider)
        .deleteTransaction(id);
    state = AsyncData(dtos.map(TransactionItem.fromDto).toList());
  }

  Future<void> updateTransaction(
    int id,
    UpdateTransactionRequestDto dto,
  ) async {
    final dtos = await ref
        .read(transactionRepositoryProvider)
        .updateTransaction(id, dto);
    state = AsyncData(dtos.map(TransactionItem.fromDto).toList());
  }

  Future<void> updateRecurringTransaction(
    int recurringId,
    UpdateRecurringRequestDto dto,
  ) async {
    final dtos = await ref
        .read(transactionRepositoryProvider)
        .updateRecurringTransaction(recurringId, dto);
    state = AsyncData(dtos.map(TransactionItem.fromDto).toList());
  }

  Future<void> cancelRecurringTransaction(int recurringId) async {
    final dtos = await ref
        .read(transactionRepositoryProvider)
        .cancelRecurringTransaction(recurringId);
    state = AsyncData(dtos.map(TransactionItem.fromDto).toList());
  }
}

final transactionsNotifierProvider =
    AsyncNotifierProvider<TransactionsNotifier, List<TransactionItem>>(
  TransactionsNotifier.new,
);

// ---------------------------------------------------------------------------
// Create transaction state
// ---------------------------------------------------------------------------

sealed class CreateTransactionState {
  const CreateTransactionState();
}

class CreateTransactionIdle extends CreateTransactionState {
  const CreateTransactionIdle();
}

class CreateTransactionLoading extends CreateTransactionState {
  const CreateTransactionLoading();
}

class CreateTransactionSuccess extends CreateTransactionState {
  const CreateTransactionSuccess({required this.transactions});
  final List<TransactionDto> transactions;
}

class CreateTransactionError extends CreateTransactionState {
  const CreateTransactionError({
    required this.message,
    this.fieldErrors = const {},
  });
  final String message;

  /// Maps field names to validation messages (from 400 responses).
  final Map<String, String> fieldErrors;
}

// ---------------------------------------------------------------------------
// Create transaction notifier
// ---------------------------------------------------------------------------

class CreateTransactionNotifier extends Notifier<CreateTransactionState> {
  @override
  CreateTransactionState build() => const CreateTransactionIdle();

  Future<void> submit(CreateTransactionRequestDto dto) async {
    state = const CreateTransactionLoading();

    try {
      final result = await ref
          .read(transactionRepositoryProvider)
          .createTransaction(dto);
      // Invalidate all providers that display transaction-derived data.
      ref.invalidate(transactionsNotifierProvider);
      ref.invalidate(homeNotifierProvider);
      ref.invalidate(accountsNotifierProvider);
      ref.invalidate(budgetNotifierProvider);
      state = CreateTransactionSuccess(transactions: result.transactions);
    } on DioException catch (e) {
      state = _mapDioError(e);
    } catch (_) {
      state = const CreateTransactionError(
          message: 'Unexpected error. Please try again.');
    }
  }

  void reset() => state = const CreateTransactionIdle();

  CreateTransactionError _mapDioError(DioException e) {
    final statusCode = e.response?.statusCode;

    if (statusCode == 400) {
      final data = e.response?.data;
      if (data is Map<String, dynamic>) {
        final raw = data['errors'];
        if (raw is Map<String, dynamic>) {
          final fieldErrors = raw.map((key, value) {
            final messages = value is List ? value : [value.toString()];
            return MapEntry(key, messages.first.toString());
          });
          return CreateTransactionError(
            message: 'Please check the highlighted fields.',
            fieldErrors: fieldErrors,
          );
        }
      }
      return const CreateTransactionError(
        message: 'Invalid data. Please review the form.',
      );
    }

    if (statusCode == 404) {
      final data = e.response?.data;
      final errorMsg =
          data is Map<String, dynamic> ? data['error'] as String? : null;

      return switch (errorMsg) {
        'No active budget found.' => const CreateTransactionError(
            message:
                'You do not have an active budget. Disable the option or create a budget.',
          ),
        'Invalid parameters.' => const CreateTransactionError(
            message: 'Invalid account or subcategory.',
          ),
        'Invalid transaction type.' => const CreateTransactionError(
            message: 'Invalid transaction type.',
          ),
        'Invalid payment type.' => const CreateTransactionError(
            message: 'Invalid payment type.',
          ),
        _ => const CreateTransactionError(message: 'Resource not found.'),
      };
    }

    if (statusCode != null && statusCode >= 500) {
      return const CreateTransactionError(
        message: 'Unexpected error. Please try again.',
      );
    }

    return const CreateTransactionError(
      message: 'Unexpected error. Please try again.',
    );
  }
}

final createTransactionProvider =
    NotifierProvider<CreateTransactionNotifier, CreateTransactionState>(
  CreateTransactionNotifier.new,
);

// ---------------------------------------------------------------------------
// Edit/delete transaction state
// ---------------------------------------------------------------------------

sealed class TransactionActionState {
  const TransactionActionState();
}

class TransactionActionIdle extends TransactionActionState {
  const TransactionActionIdle();
}

class TransactionActionLoading extends TransactionActionState {
  const TransactionActionLoading();
}

class TransactionActionSuccess extends TransactionActionState {
  const TransactionActionSuccess();
}

class TransactionActionError extends TransactionActionState {
  const TransactionActionError({required this.message});
  final String message;
}

class TransactionActionNotifier extends Notifier<TransactionActionState> {
  @override
  TransactionActionState build() => const TransactionActionIdle();

  Future<void> delete(int id) async {
    state = const TransactionActionLoading();
    try {
      await ref
          .read(transactionsNotifierProvider.notifier)
          .deleteTransaction(id);
      state = const TransactionActionSuccess();
    } on DioException catch (e) {
      state = TransactionActionError(message: _mapError(e));
    } catch (_) {
      state = const TransactionActionError(
          message: 'Unexpected error. Please try again.');
    }
  }

  Future<void> update(int id, UpdateTransactionRequestDto dto) async {
    state = const TransactionActionLoading();
    try {
      await ref
          .read(transactionsNotifierProvider.notifier)
          .updateTransaction(id, dto);
      state = const TransactionActionSuccess();
    } on DioException catch (e) {
      state = TransactionActionError(message: _mapError(e));
    } catch (_) {
      state = const TransactionActionError(
          message: 'Unexpected error. Please try again.');
    }
  }

  Future<void> updateRecurring(
    int recurringId,
    UpdateRecurringRequestDto dto,
  ) async {
    state = const TransactionActionLoading();
    try {
      await ref
          .read(transactionsNotifierProvider.notifier)
          .updateRecurringTransaction(recurringId, dto);
      state = const TransactionActionSuccess();
    } on DioException catch (e) {
      state = TransactionActionError(message: _mapError(e));
    } catch (_) {
      state = const TransactionActionError(
          message: 'Unexpected error. Please try again.');
    }
  }

  Future<void> cancelRecurring(int recurringId) async {
    state = const TransactionActionLoading();
    try {
      await ref
          .read(transactionsNotifierProvider.notifier)
          .cancelRecurringTransaction(recurringId);
      state = const TransactionActionSuccess();
    } on DioException catch (e) {
      state = TransactionActionError(message: _mapError(e));
    } catch (_) {
      state = const TransactionActionError(
          message: 'Unexpected error. Please try again.');
    }
  }

  void reset() => state = const TransactionActionIdle();

  String _mapError(DioException e) {
    final statusCode = e.response?.statusCode;
    if (statusCode == 404) return 'Transaction not found.';
    if (statusCode != null && statusCode >= 500) {
      return 'Server error. Please try again.';
    }
    return 'Unexpected error. Please try again.';
  }
}

final transactionActionProvider =
    NotifierProvider<TransactionActionNotifier, TransactionActionState>(
  TransactionActionNotifier.new,
);
