import { api } from "./axios";
import type {
  AuthResponse,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  TwoFactorLoginRequest,
  UpdateTwoFactorRequest,
  VerifyEmailRequest,
} from "@/lib/types/auth.types";

export const authApi = {
  // Answers with tokens or with a challenge (unverified email, two-factor) — both 200.
  // Narrow the result with isLoginChallenge before reading accessToken.
  login: async (data: LoginRequest): Promise<LoginResult> => {
    const response = await api.post<LoginResult>("/user/login", data);
    return response.data;
  },

  // No tokens here: the account is created but unusable until the emailed code is
  // confirmed through verifyEmail, which is what signs the user in.
  register: async (data: Omit<RegisterRequest, "confirmPassword">): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/user/register", {
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/user/verify-email", data);
    return response.data;
  },

  resendVerificationCode: async (email: string): Promise<void> => {
    await api.post("/user/verify-email/resend", { email });
  },

  verifyTwoFactor: async (data: TwoFactorLoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/user/login/two-factor", data);
    return response.data;
  },

  // Always resolves, even for an address that is not registered — the response is
  // deliberately identical either way.
  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/user/forgot-password", { email });
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post("/user/reset-password", data);
  },

  updateTwoFactor: async (data: UpdateTwoFactorRequest): Promise<void> => {
    await api.patch("/user/two-factor", data);
  },

  // Refresh token travels as HttpOnly cookie — no body needed.
  refresh: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/user/refresh", {});
    return response.data;
  },

  // Refresh token travels as HttpOnly cookie — backend invalidates it server-side.
  logout: async (): Promise<void> => {
    await api.post("/user/logout", {});
  },
};
