/// The subscription state served by GET /api/subscription. The app only reads it:
/// subscribing happens on the website (the stores require their own in-app
/// purchase for digital subscriptions sold inside the app).
class SubscriptionState {
  const SubscriptionState({
    required this.hasAccess,
    this.status,
    this.endReason,
    this.plan,
    this.cycle,
    this.billingMethod,
    this.trialEndsAt,
    this.currentPeriodEnd,
    this.showRenewalReminder = false,
    this.pendingChargeAmount,
    this.pendingChargeDueDate,
  });

  final bool hasAccess;

  /// Trialing, PendingPayment, Active, Canceled, Expired — or null when the user
  /// never subscribed.
  final String? status;

  /// Canceled, PaymentFailed, Refunded, Chargeback.
  final String? endReason;
  final String? plan;
  final String? cycle;
  final String? billingMethod;
  final DateTime? trialEndsAt;
  final DateTime? currentPeriodEnd;

  /// Pix/boleto renewal open in the last days of the period.
  final bool showRenewalReminder;

  /// Cents.
  final int? pendingChargeAmount;
  final DateTime? pendingChargeDueDate;

  bool get endedForNonPayment => status == 'Expired' && endReason == 'PaymentFailed';
  bool get isPendingPayment => status == 'PendingPayment';

  factory SubscriptionState.fromJson(Map<String, dynamic> json) {
    final pending = json['pendingCharge'] as Map<String, dynamic>?;
    return SubscriptionState(
      hasAccess: json['hasAccess'] as bool? ?? false,
      status: json['status'] as String?,
      endReason: json['endReason'] as String?,
      plan: json['plan'] as String?,
      cycle: json['cycle'] as String?,
      billingMethod: json['billingMethod'] as String?,
      trialEndsAt: _date(json['trialEndsAt']),
      currentPeriodEnd: _date(json['currentPeriodEnd']),
      showRenewalReminder: json['showRenewalReminder'] as bool? ?? false,
      pendingChargeAmount: (pending?['amount'] as num?)?.toInt(),
      pendingChargeDueDate: _date(pending?['dueDate']),
    );
  }

  static DateTime? _date(Object? value) =>
      value is String ? DateTime.tryParse(value)?.toLocal() : null;
}
