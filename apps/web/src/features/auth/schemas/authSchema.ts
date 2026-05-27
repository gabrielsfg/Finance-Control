import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[a-z]/, "Precisa ter letra minúscula")
  .regex(/[A-Z]/, "Precisa ter letra maiúscula")
  .regex(/[0-9]/, "Precisa ter um número")
  .regex(/[^a-zA-Z0-9]/, "Precisa ter um caractere especial");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().min(1, "E-mail obrigatório").email("E-mail inválido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export type PasswordStrength = "fraca" | "média" | "forte";

export const getPasswordStrength = (password: string): PasswordStrength | null => {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  if (passed <= 2) return "fraca";
  if (passed <= 4) return "média";
  return "forte";
};
