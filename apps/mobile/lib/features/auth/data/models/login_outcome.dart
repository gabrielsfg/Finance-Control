import '../dtos/auth_response_dto.dart';

/// Why a login with the right password did not return tokens.
enum LoginChallenge {
  emailNotVerified,
  twoFactorRequired;

  /// The API serialises enums as their C# names.
  static LoginChallenge fromApi(String value) => switch (value) {
        'EmailNotVerified' => LoginChallenge.emailNotVerified,
        _ => LoginChallenge.twoFactorRequired,
      };
}

/// The two shapes `POST /login` can answer with, both as 200.
///
/// Sealed so the caller has to handle the challenge branch — the previous version
/// assumed tokens always came back, and that assumption is exactly what breaks
/// when the account is unverified or two-factor is on.
sealed class LoginOutcome {
  const LoginOutcome();
}

class LoginAuthenticated extends LoginOutcome {
  const LoginAuthenticated(this.tokens);

  final AuthResponseDto tokens;
}

class LoginChallenged extends LoginOutcome {
  const LoginChallenged({required this.challenge, this.challengeToken});

  final LoginChallenge challenge;

  /// Present for [LoginChallenge.twoFactorRequired] — proof the password step ran.
  final String? challengeToken;
}
