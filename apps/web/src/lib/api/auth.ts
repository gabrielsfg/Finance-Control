import { api } from "./axios";
import type { AuthResponse } from "@/lib/types/auth.types";
import type { LoginRequest, RegisterRequest } from "@/lib/types/auth.types";

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/user/login", data);
    return response.data;
  },

  register: async (data: Omit<RegisterRequest, "confirmPassword">): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/user/register", {
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return response.data;
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
