import 'dart:io' show Platform;

/// Application environment configuration.
///
/// Everything here comes from `--dart-define`, so a build never has to be edited
/// to point somewhere else:
///
/// ```
/// flutter run                                   # local, host machine
/// flutter build apk --dart-define=APP_ENV=production \
///                   --dart-define=API_BASE_URL=https://api.seudominio.com.br
/// ```
///
/// Defaults keep a fresh clone running against a local API with no flags.
enum AppEnv { local, staging, production }

abstract class AppConfig {
  static const String _envName =
      String.fromEnvironment('APP_ENV', defaultValue: 'local');

  /// Empty means "not provided" — `String.fromEnvironment` cannot be null.
  static const String _apiBaseUrlOverride =
      String.fromEnvironment('API_BASE_URL');

  static const int _localPort =
      int.fromEnvironment('API_PORT', defaultValue: 5112);

  static AppEnv get env => switch (_envName) {
        'production' => AppEnv.production,
        'staging' => AppEnv.staging,
        _ => AppEnv.local,
      };

  /// Base URL for the REST API (no trailing slash).
  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) {
      // A trailing slash here would double up with every endpoint constant.
      return _apiBaseUrlOverride.endsWith('/')
          ? _apiBaseUrlOverride.substring(0, _apiBaseUrlOverride.length - 1)
          : _apiBaseUrlOverride;
    }

    if (env == AppEnv.local) {
      // Run the API with the Kestrel HTTP profile: dotnet run --launch-profile http
      // (IIS Express only binds to localhost and won't accept the emulator's traffic).
      // Android emulator: 10.0.2.2 is the host-machine loopback alias.
      // iOS simulator: localhost already points at the host.
      // Physical device: pass --dart-define=API_BASE_URL=http://192.168.x.x:5112.
      final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
      return 'http://$host:$_localPort';
    }

    // Failing loudly beats shipping a build that quietly talks to nothing.
    throw StateError(
      'API_BASE_URL is required for the $_envName build. '
      'Pass --dart-define=API_BASE_URL=https://api.example.com',
    );
  }

  /// Whether the app should bypass SSL certificate verification.
  /// MUST be false in staging and production.
  static bool get allowBadCertificate => env == AppEnv.local;

  /// Current environment label (useful for debug banners).
  static String get envLabel => env.name;
}
