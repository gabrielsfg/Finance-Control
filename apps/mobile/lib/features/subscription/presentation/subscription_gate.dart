import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/subscription_labels.dart';
import '../../../shared/widgets/app_outline_button.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/subscription_state.dart';
import '../providers/subscription_provider.dart';

/// The paywall inside the app shell. Without access, every tab except the menu and
/// the profile (data export, account deletion) shows why and where to subscribe.
///
/// Deliberately no link or button to a payment page: the stores only allow digital
/// subscriptions sold inside the app through their own in-app purchase, so the app
/// just says "on the website". It fails open while loading or on error — the API is
/// the real gate and answers 403 anyway.
class SubscriptionGate extends ConsumerWidget {
  const SubscriptionGate({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  static const _openPrefixes = ['/menu', '/profile'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(subscriptionProvider).valueOrNull;
    final isOpenRoute = _openPrefixes.any(location.startsWith);

    if (state != null && !state.hasAccess && !isOpenRoute) {
      return _SubscriptionRequired(state: state);
    }

    final banner = state == null ? null : renewalBannerText(state);
    if (banner == null) return child;

    return Column(
      children: [
        _RenewalBanner(message: banner),
        Expanded(child: child),
      ],
    );
  }
}

class _SubscriptionRequired extends ConsumerWidget {
  const _SubscriptionRequired({required this.state});

  final SubscriptionState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final failed = state.endedForNonPayment;
    final accent = failed ? t.clay : t.gold;

    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: GlassCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.14),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(failed ? LucideIcons.alertCircle : LucideIcons.lock, color: accent, size: 22),
                ),
                const SizedBox(height: 16),
                Text(
                  paywallTitle(state),
                  textAlign: TextAlign.center,
                  style: AppTextStyles.h2(t.txtPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  paywallMessage(state),
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodySm(t.txtSecondary),
                ),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: 'Já assinei, atualizar',
                  icon: const Icon(LucideIcons.refreshCw, size: 16, color: Colors.white),
                  onPressed: () => ref.invalidate(subscriptionProvider),
                ),
                const SizedBox(height: 10),
                AppOutlineButton(
                  label: 'Sair da conta',
                  onPressed: () => ref.read(authNotifierProvider.notifier).logout(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RenewalBanner extends StatelessWidget {
  const _RenewalBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return SafeArea(
      bottom: false,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: t.gold.withValues(alpha: 0.12),
          border: Border.all(color: t.gold.withValues(alpha: 0.35)),
          borderRadius: AppRadius.baseAll,
        ),
        child: Row(
          children: [
            Icon(LucideIcons.bellRing, size: 16, color: t.gold),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: AppTextStyles.caption(t.txtPrimary))),
          ],
        ),
      ),
    );
  }
}
