import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_provider.dart';
import 'core/utils/app_locale.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: FinanceControlApp()));
}

class FinanceControlApp extends ConsumerWidget {
  const FinanceControlApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final appLocale = ref.watch(appLocaleProvider);

    // Derive Locale from BCP 47 tag (e.g. "pt-BR" → Locale("pt", "BR"))
    final localeParts = appLocale.locale.split('-');
    final materialLocale = localeParts.length == 2
        ? Locale(localeParts[0], localeParts[1])
        : Locale(localeParts[0]);

    return AppLocaleScope(
      locale: appLocale,
      child: MaterialApp.router(
        title: 'FinanceControl',
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: themeMode,
        locale: materialLocale,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
