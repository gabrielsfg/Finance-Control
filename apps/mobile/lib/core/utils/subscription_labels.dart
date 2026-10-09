import '../../features/subscription/data/models/subscription_state.dart';
import 'formatters.dart';

/// Copy for the paywall and the renewal banner. Subscribing happens on the website,
/// so nothing here points to a payment flow inside the app.

String paywallTitle(SubscriptionState state) {
  if (state.endedForNonPayment) return 'Sua assinatura foi cancelada por falta de pagamento';
  if (state.isPendingPayment) return 'Falta confirmar o pagamento';
  if (state.status == 'Expired') return 'Sua assinatura terminou';
  return 'Assine pelo site para continuar';
}

String paywallMessage(SubscriptionState state) {
  if (state.isPendingPayment) {
    return 'Assim que o pagamento for confirmado, o app é liberado automaticamente.';
  }
  final reason = state.endedForNonPayment
      ? 'Não recebemos o pagamento da renovação. '
      : '';
  return '${reason}Seus dados continuam guardados. Para assinar ou renovar, '
      'acesse a Quantia pelo navegador, no computador ou no celular, e entre com esta conta.';
}

/// The banner shown on every screen while something needs the user's attention:
/// an open Pix/boleto renewal or a trial about to convert. Null when there is nothing.
String? renewalBannerText(SubscriptionState state, {DateTime? now}) {
  final today = now ?? DateTime.now();

  if (state.showRenewalReminder && state.pendingChargeAmount != null) {
    final due = state.pendingChargeDueDate;
    final dueText = due == null ? '' : ' até ${formatDate(due)}';
    return 'Sua assinatura vence em breve. Pague ${formatCurrency(state.pendingChargeAmount!)}$dueText '
        'pelo Pix ou boleto enviado ao seu e-mail para não perder o acesso.';
  }

  final trialEnd = state.trialEndsAt;
  if (state.status == 'Trialing' && trialEnd != null) {
    final days = trialEnd.difference(today).inHours / 24;
    if (days <= 3) {
      final when = days <= 1 ? 'amanhã' : 'em ${days.ceil()} dias';
      return 'Seu teste grátis termina $when. Depois disso, a assinatura é cobrada no cartão.';
    }
  }

  return null;
}
