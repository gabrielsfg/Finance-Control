import type { Metadata } from "next";
import { LoginPage } from "@/features/auth/LoginPage";

export const metadata: Metadata = {
  title: "Entrar ou criar conta",
  description:
    "Acesse sua conta Quantia ou crie a sua para organizar contas, cartões, orçamento, metas e investimentos em um lugar só.",
  alternates: { canonical: "/login" },
};

export default LoginPage;
