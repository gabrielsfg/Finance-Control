// Domain models for in-app notifications. Plain classes, manual fromJson —
// same convention as goals and recurrences.

/// Wire values mirror `EnumNotificationType` on the API. The label is only used
/// where the server does not already provide a written title.
enum NotificationType {
  system('System'),
  recurrenceCharged('RecurrenceCharged'),
  recurrenceUpcoming('RecurrenceUpcoming'),
  cardDueSoon('CardDueSoon'),
  cardClosingSoon('CardClosingSoon'),
  budgetThreshold('BudgetThreshold'),
  budgetExceeded('BudgetExceeded'),
  priceAlert('PriceAlert'),
  goalReached('GoalReached');

  const NotificationType(this.wire);
  final String wire;

  static NotificationType fromWire(String? v) =>
      values.firstWhere((e) => e.wire == v, orElse: () => NotificationType.system);
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.actionUrl,
    required this.isRead,
    required this.createdAt,
  });

  final int id;
  final NotificationType type;
  final String title;
  final String body;
  final String? actionUrl;
  final bool isRead;
  final DateTime createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: (json['id'] as num).toInt(),
        type: NotificationType.fromWire(json['type'] as String?),
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        actionUrl: json['actionUrl'] as String?,
        isRead: json['isRead'] as bool? ?? false,
        // The API stamps UTC; the list reads better in the device's own time.
        createdAt:
            DateTime.tryParse(json['createdAt'] as String? ?? '')?.toLocal() ??
                DateTime.now(),
      );
}

class NotificationPreferences {
  const NotificationPreferences({
    required this.recurrenceChargedEnabled,
    required this.cardDueEnabled,
    required this.cardDueDaysAhead,
    required this.cardClosingEnabled,
    required this.cardClosingDaysAhead,
    required this.budgetAlertEnabled,
    required this.budgetWarningPercent,
  });

  final bool recurrenceChargedEnabled;
  final bool cardDueEnabled;
  final int cardDueDaysAhead;
  final bool cardClosingEnabled;
  final int cardClosingDaysAhead;
  final bool budgetAlertEnabled;
  final int budgetWarningPercent;

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) =>
      NotificationPreferences(
        recurrenceChargedEnabled:
            json['recurrenceChargedEnabled'] as bool? ?? true,
        cardDueEnabled: json['cardDueEnabled'] as bool? ?? true,
        cardDueDaysAhead: (json['cardDueDaysAhead'] as num?)?.toInt() ?? 3,
        cardClosingEnabled: json['cardClosingEnabled'] as bool? ?? true,
        cardClosingDaysAhead:
            (json['cardClosingDaysAhead'] as num?)?.toInt() ?? 3,
        budgetAlertEnabled: json['budgetAlertEnabled'] as bool? ?? true,
        budgetWarningPercent:
            (json['budgetWarningPercent'] as num?)?.toInt() ?? 80,
      );

  Map<String, dynamic> toJson() => {
        'recurrenceChargedEnabled': recurrenceChargedEnabled,
        'cardDueEnabled': cardDueEnabled,
        'cardDueDaysAhead': cardDueDaysAhead,
        'cardClosingEnabled': cardClosingEnabled,
        'cardClosingDaysAhead': cardClosingDaysAhead,
        'budgetAlertEnabled': budgetAlertEnabled,
        'budgetWarningPercent': budgetWarningPercent,
      };

  /// The endpoint takes the whole object, so a single toggle still has to send
  /// every field — this keeps the call sites to one changed value.
  NotificationPreferences copyWith({
    bool? recurrenceChargedEnabled,
    bool? cardDueEnabled,
    int? cardDueDaysAhead,
    bool? cardClosingEnabled,
    int? cardClosingDaysAhead,
    bool? budgetAlertEnabled,
    int? budgetWarningPercent,
  }) =>
      NotificationPreferences(
        recurrenceChargedEnabled:
            recurrenceChargedEnabled ?? this.recurrenceChargedEnabled,
        cardDueEnabled: cardDueEnabled ?? this.cardDueEnabled,
        cardDueDaysAhead: cardDueDaysAhead ?? this.cardDueDaysAhead,
        cardClosingEnabled: cardClosingEnabled ?? this.cardClosingEnabled,
        cardClosingDaysAhead:
            cardClosingDaysAhead ?? this.cardClosingDaysAhead,
        budgetAlertEnabled: budgetAlertEnabled ?? this.budgetAlertEnabled,
        budgetWarningPercent:
            budgetWarningPercent ?? this.budgetWarningPercent,
      );
}
