// Domain models for the Goals (metas) feature. Plain classes, manual fromJson.
// Money values are in cents (int).

int _asInt(dynamic v) => v is int ? v : (v as num?)?.toInt() ?? 0;
DateTime? _asDate(dynamic v) =>
    v == null ? null : DateTime.tryParse(v as String);

enum GoalType {
  item('Item', 'Compra'),
  investment('Investment', 'Investimento');

  const GoalType(this.wire, this.labelPt);
  final String wire;
  final String labelPt;
  static GoalType fromWire(String? v) =>
      values.firstWhere((e) => e.wire == v, orElse: () => GoalType.item);
}

enum GoalPriority {
  low('Low', 'Baixa'),
  medium('Medium', 'Média'),
  high('High', 'Alta');

  const GoalPriority(this.wire, this.labelPt);
  final String wire;
  final String labelPt;
  static GoalPriority fromWire(String? v) =>
      values.firstWhere((e) => e.wire == v, orElse: () => GoalPriority.medium);
}

enum GoalStatus {
  active('Active', 'Ativa'),
  achieved('Achieved', 'Concluída'),
  cancelled('Cancelled', 'Cancelada');

  const GoalStatus(this.wire, this.labelPt);
  final String wire;
  final String labelPt;
  static GoalStatus fromWire(String? v) =>
      values.firstWhere((e) => e.wire == v, orElse: () => GoalStatus.active);
}

class Goal {
  const Goal({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.targetAmount,
    required this.priority,
    required this.status,
    this.color,
    this.url,
    required this.targetDate,
    required this.currentAmount,
    this.accountId,
    this.targetTicker,
  });

  final int id;
  final String name;
  final String? description;
  final GoalType type;
  final int targetAmount; // cents
  final GoalPriority priority;
  final GoalStatus status;
  final String? color;
  final String? url;
  final DateTime? targetDate;
  final int currentAmount; // cents
  final int? accountId;
  final String? targetTicker;

  double get progress =>
      targetAmount == 0 ? 0 : (currentAmount / targetAmount).clamp(0.0, 1.0);
  int get remaining =>
      (targetAmount - currentAmount) < 0 ? 0 : targetAmount - currentAmount;
  bool get isInvestment => type == GoalType.investment;

  factory Goal.fromJson(Map<String, dynamic> j) => Goal(
        id: _asInt(j['id']),
        name: j['name'] as String? ?? '',
        description: j['description'] as String?,
        type: GoalType.fromWire(j['type'] as String?),
        targetAmount: _asInt(j['targetAmount']),
        priority: GoalPriority.fromWire(j['priority'] as String?),
        status: GoalStatus.fromWire(j['status'] as String?),
        color: j['color'] as String?,
        url: j['url'] as String?,
        targetDate: _asDate(j['targetDate']),
        currentAmount: _asInt(j['currentAmount']),
        accountId: j['accountId'] == null ? null : _asInt(j['accountId']),
        targetTicker: j['targetTicker'] as String?,
      );
}

class GoalTransaction {
  const GoalTransaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.description,
    required this.transactionDate,
  });

  final int id;
  final int amount; // cents
  final String type; // Income | Expense | Transfer
  final String description;
  final DateTime? transactionDate;

  factory GoalTransaction.fromJson(Map<String, dynamic> j) => GoalTransaction(
        id: _asInt(j['id']),
        amount: _asInt(j['amount']),
        type: j['type'] as String? ?? '',
        description: j['description'] as String? ?? '',
        transactionDate: _asDate(j['transactionDate']),
      );
}

class GoalDetail {
  const GoalDetail({required this.goal, required this.transactions});
  final Goal goal;
  final List<GoalTransaction> transactions;

  factory GoalDetail.fromJson(Map<String, dynamic> j) => GoalDetail(
        goal: Goal.fromJson(j),
        transactions: (j['transactions'] as List? ?? [])
            .map((e) => GoalTransaction.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

// ── Request payloads ──────────────────────────────────────────────────────────

class CreateGoalRequest {
  const CreateGoalRequest({
    required this.name,
    this.description,
    this.type = GoalType.item,
    required this.targetAmount,
    this.priority = GoalPriority.medium,
    this.url,
    required this.targetDate,
  });

  final String name;
  final String? description;
  final GoalType type;
  final int targetAmount;
  final GoalPriority priority;
  final String? url;
  final DateTime targetDate;

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null && description!.isNotEmpty)
          'description': description,
        'type': type.wire,
        'targetAmount': targetAmount,
        'priority': priority.wire,
        if (url != null && url!.isNotEmpty) 'url': url,
        'targetDate': targetDate.toIso8601String().split('T').first,
      };
}

class UpdateGoalRequest {
  const UpdateGoalRequest({
    this.name,
    this.description,
    this.targetAmount,
    this.priority,
    this.status,
    this.targetDate,
    this.url,
  });

  final String? name;
  final String? description;
  final int? targetAmount;
  final GoalPriority? priority;
  final GoalStatus? status;
  final DateTime? targetDate;
  final String? url;

  Map<String, dynamic> toJson() => {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (targetAmount != null) 'targetAmount': targetAmount,
        if (priority != null) 'priority': priority!.wire,
        if (status != null) 'status': status!.wire,
        if (targetDate != null)
          'targetDate': targetDate!.toIso8601String().split('T').first,
        if (url != null) 'url': url,
      };
}

class ContributeGoalRequest {
  const ContributeGoalRequest({
    required this.amount,
    this.sourceAccountId,
    this.description,
  });
  final int amount;
  final int? sourceAccountId;
  final String? description;

  Map<String, dynamic> toJson() => {
        'amount': amount,
        if (sourceAccountId != null) 'sourceAccountId': sourceAccountId,
        if (description != null && description!.isNotEmpty)
          'description': description,
      };
}

class WithdrawGoalRequest {
  const WithdrawGoalRequest({
    required this.amount,
    this.destinationAccountId,
    this.description,
  });
  final int amount;
  final int? destinationAccountId;
  final String? description;

  Map<String, dynamic> toJson() => {
        'amount': amount,
        if (destinationAccountId != null)
          'destinationAccountId': destinationAccountId,
        if (description != null && description!.isNotEmpty)
          'description': description,
      };
}
