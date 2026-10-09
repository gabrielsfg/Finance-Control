import 'package:finance_control_front/core/utils/subscription_labels.dart';
import 'package:finance_control_front/features/subscription/data/models/subscription_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SubscriptionState.fromJson', () {
    test('reads the pending charge and the flags', () {
      final state = SubscriptionState.fromJson({
        'hasAccess': true,
        'status': 'Active',
        'billingMethod': 'Pix',
        'showRenewalReminder': true,
        'pendingCharge': {'amount': 3499, 'dueDate': '2026-11-07'},
      });

      expect(state.hasAccess, isTrue);
      expect(state.pendingChargeAmount, 3499);
      expect(state.pendingChargeDueDate?.day, 7);
    });

    test('a user who never subscribed has no access and no status', () {
      final state = SubscriptionState.fromJson({'hasAccess': false});
      expect(state.hasAccess, isFalse);
      expect(state.status, isNull);
    });
  });

  group('paywall copy', () {
    test('explains a cancellation for lack of payment', () {
      const state = SubscriptionState(hasAccess: false, status: 'Expired', endReason: 'PaymentFailed');
      expect(paywallTitle(state), contains('falta de pagamento'));
      expect(paywallMessage(state), contains('navegador'));
    });
  });

  group('renewal banner', () {
    test('shows for an open Pix renewal', () {
      final state = SubscriptionState(
        hasAccess: true,
        status: 'Active',
        showRenewalReminder: true,
        pendingChargeAmount: 3499,
        pendingChargeDueDate: DateTime(2026, 11, 7),
      );
      expect(renewalBannerText(state), contains('Pague'));
    });

    test('shows in the last days of a trial only', () {
      final now = DateTime(2026, 11, 1, 12);
      final ending = SubscriptionState(hasAccess: true, status: 'Trialing', trialEndsAt: DateTime(2026, 11, 3, 12));
      final early = SubscriptionState(hasAccess: true, status: 'Trialing', trialEndsAt: DateTime(2026, 11, 20));

      expect(renewalBannerText(ending, now: now), contains('teste grátis termina'));
      expect(renewalBannerText(early, now: now), isNull);
    });
  });
}
