export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  /** Which version was accepted, and when, is decided server-side — this is only the tick. */
  acceptedTerms: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

/** Why a login with the right password did not return tokens. */
export type LoginChallenge = "EmailNotVerified" | "TwoFactorRequired";

export type LoginChallengeResponse = {
  challenge: LoginChallenge;
  /** Only for TwoFactorRequired — hand it back with the code. */
  challengeToken: string | null;
};

/**
 * Login answers with tokens or with a challenge, both as 200. Narrow with the
 * `challenge` key rather than by status code.
 */
export type LoginResult = AuthResponse | LoginChallengeResponse;

export const isLoginChallenge = (result: LoginResult): result is LoginChallengeResponse =>
  "challenge" in result;

export type RegisterResponse = {
  verificationRequired: boolean;
};

export type VerifyEmailRequest = {
  email: string;
  code: string;
};

export type TwoFactorLoginRequest = {
  challengeToken: string;
  code: string;
  trustDevice: boolean;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};

export type UpdateTwoFactorRequest = {
  enabled: boolean;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Premium";
};
