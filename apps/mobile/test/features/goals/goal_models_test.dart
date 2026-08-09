import 'package:flutter_test/flutter_test.dart';
import 'package:finance_control_front/features/goals/data/goal_models.dart';

void main() {
  group('Goal.fromJson', () {
    test('parses an item goal with progress and remaining', () {
      final json = {
        'id': 1,
        'name': 'Viagem',
        'description': 'Férias',
        'type': 'Item',
        'targetAmount': 500000,
        'priority': 'High',
        'status': 'Active',
        'color': '#1F3CE0',
        'url': 'https://example.com',
        'targetDate': '2026-12-01',
        'currentAmount': 125000,
        'accountId': 2,
      };

      final goal = Goal.fromJson(json);

      expect(goal.type, GoalType.item);
      expect(goal.priority, GoalPriority.high);
      expect(goal.priority.labelPt, 'Alta');
      expect(goal.status, GoalStatus.active);
      expect(goal.progress, closeTo(0.25, 0.001));
      expect(goal.remaining, 375000);
      expect(goal.isInvestment, isFalse);
    });

    test('handles null currentAmount and clamps progress', () {
      final goal = Goal.fromJson({
        'id': 2,
        'name': 'Reserva',
        'type': 'Investment',
        'targetAmount': 100000,
        'currentAmount': 150000,
      });
      expect(goal.currentAmount, 150000);
      expect(goal.progress, 1.0); // clamped
      expect(goal.remaining, 0);
      expect(goal.isInvestment, isTrue);
    });
  });

  group('request payloads', () {
    test('CreateGoalRequest formats date and omits empty optionals', () {
      final json = CreateGoalRequest(
        name: 'Carro',
        targetAmount: 8000000,
        priority: GoalPriority.medium,
        targetDate: DateTime(2027, 6, 15),
      ).toJson();

      expect(json['name'], 'Carro');
      expect(json['type'], 'Item');
      expect(json['priority'], 'Medium');
      expect(json['targetDate'], '2027-06-15');
      expect(json.containsKey('url'), isFalse);
      expect(json.containsKey('description'), isFalse);
    });

    test('ContributeGoalRequest includes optional account only when set', () {
      expect(
        const ContributeGoalRequest(amount: 5000).toJson(),
        {'amount': 5000},
      );
      expect(
        const ContributeGoalRequest(amount: 5000, sourceAccountId: 3).toJson(),
        {'amount': 5000, 'sourceAccountId': 3},
      );
    });
  });
}
