import 'dart:io' show Platform;

/// Application environment configuration.
///
/// To switch environments, change [_current] to the desired [AppEnv].
/// In CI/CD, you can swap this via dart-define or a build flavor.
enum AppEnv { local, staging, production }

abstract class AppConfig {
  static const AppEnv _current = AppEnv.local;

  /// Base URL for the REST API (no trailing slash).
  static String get apiBaseUrl {
    switch (_current) {
      case AppEnv.local:
        // Run the API with the Kestrel HTTP profile: dotnet run --launch-profile http
        // (IIS Express only binds to localhost and won't accept the emulator's traffic).
        // Android emulator: 10.0.2.2 is the host-machine loopback alias.
        // iOS simulator: localhost already points at the host.
        // Physical device: replace with your machine's LAN IP, e.g. 192.168.x.x.
        final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
        return 'http://$host:5112';
      case AppEnv.staging:
        return 'https://staging-api.financecontrol.example.com';
      case AppEnv.production:
        return 'https://api.financecontrol.example.com';
    }
  }

  /// Whether the app should bypass SSL certificate verification.
  /// MUST be false in staging and production.
  static bool get allowBadCertificate => _current == AppEnv.local;

  /// Current environment label (useful for debug banners).
  static String get envLabel => _current.name;
}
