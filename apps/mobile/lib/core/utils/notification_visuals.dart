import 'package:flutter/widgets.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../../features/notifications/data/notification_models.dart';

/// Icon + accent colour a notification is drawn with, picked from its type.
class NotificationVisual {
  const NotificationVisual(this.icon, this.color);

  final IconData icon;
  final Color color;
}

/// Mirrors the web client's mapping so the same alert reads the same on both
/// clients: cobalt for recurrences, gold for card dates, clay once a budget is
/// already over.
NotificationVisual notificationVisual(
  AppThemeTokens t,
  NotificationType type,
) =>
    switch (type) {
      NotificationType.system => NotificationVisual(
          LucideIcons.info,
          t.txtTertiary,
        ),
      NotificationType.recurrenceCharged => NotificationVisual(
          LucideIcons.repeat,
          t.accent,
        ),
      NotificationType.recurrenceUpcoming => NotificationVisual(
          LucideIcons.calendarClock,
          t.accent,
        ),
      NotificationType.cardDueSoon => NotificationVisual(
          LucideIcons.creditCard,
          t.gold,
        ),
      NotificationType.cardClosingSoon => NotificationVisual(
          LucideIcons.creditCard,
          t.gold,
        ),
      NotificationType.budgetThreshold => NotificationVisual(
          LucideIcons.pieChart,
          t.gold,
        ),
      NotificationType.budgetExceeded => NotificationVisual(
          LucideIcons.pieChart,
          t.clay,
        ),
      NotificationType.priceAlert => NotificationVisual(
          LucideIcons.trendingUp,
          t.accent,
        ),
      NotificationType.goalReached => NotificationVisual(
          LucideIcons.target,
          t.moss,
        ),
    };
