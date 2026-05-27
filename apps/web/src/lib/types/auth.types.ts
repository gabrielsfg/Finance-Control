export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Premium";
};
