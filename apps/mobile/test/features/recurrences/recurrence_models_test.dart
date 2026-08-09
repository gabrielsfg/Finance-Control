import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/features/recurrences/data/recurrence_models.dart';

void main() {
  group('RecurrencePageData.fromJson', () {
    test('parses totals, recurring and installments', () {
      final json = {
        'totalMonthlyAmount': 150000,
        'subscriptionMonthlyAmount': 90000,
        'installmentMonthlyAmount': 60000,
        'activeRecurringCount': 2,
        'activeInstallmentCount': 1,
        'monthlyIncome': 500000,
        'recurring': [
          {
            'id': 1,
            'subCategoryId': 10,
            'subCategoryName': 'Streaming',
            'subCategoryEmoji': '🎬',
            'categoryId': 5,
            'categoryName': 'Lazer',
            'categoryColor': '#FF8A5B',
            'accountId': 3,
            'accountName': 'Nubank',
            'value': 4500,
            'type': 'Expense',
            'description': 'Netflix',
            'recurrence': 'Monthly',
            'startDate': '2026-01-01',
            'endDate': null,
            'isActive': true,
          },
        ],
        'installments': [
          {
            'id': 2,
            'subCategoryId': 11,
            'subCategoryName': 'Eletrônicos',
            'categoryId': 6,
            'categoryName': 'Compras',
            'accountId': 3,
            'accountName': 'Nubank',
            'value': 20000,
            'totalValue': 240000,
            'type': 'Expense',
            'description': 'Notebook',
            'transactionDate': '2026-02-10',
            'totalInstallments': 12,
            'paidInstallments': 3,
            'remainingInstallments': 9,
            'remainingAmount': 180000,
            'paymentMethod': 'Credit',
          },
        ],
      };

      final data = RecurrencePageData.fromJson(json);

      expect(data.totalMonthlyAmount, 150000);
      expect(data.incomeShare, closeTo(0.3, 0.001));
      expect(data.recurring.single.recurrence, RecurrenceType.monthly);
      expect(data.recurring.single.recurrence.labelPt, 'Mensal');
      expect(data.recurring.single.isIncome, isFalse);
      expect(data.installments.single.progress, closeTo(0.25, 0.001));
      expect(data.installments.single.remainingAmount, 180000);
    });

    test('empty payload yields safe defaults', () {
      final data = RecurrencePageData.fromJson({});
      expect(data.recurring, isEmpty);
      expect(data.installments, isEmpty);
      expect(data.incomeShare, 0);
    });
  });

  group('UpdateRecurringRequest.toJson', () {
    test('omits null fields and formats endDate as date-only', () {
      final req = UpdateRecurringRequest(
        value: 5000,
        endDate: DateTime(2026, 12, 31),
      );
      final json = req.toJson();
      expect(json['value'], 5000);
      expect(json['endDate'], '2026-12-31');
      expect(json.containsKey('description'), isFalse);
    });
  });
}
