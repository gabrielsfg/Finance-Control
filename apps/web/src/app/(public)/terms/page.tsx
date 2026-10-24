import type { Metadata } from "next";
import { TermsOfUsePage } from "@/features/legal/TermsOfUsePage";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras de uso da Quantia: conta, assinatura, Open Finance, IA e responsabilidades.",
  alternates: { canonical: "/terms" },
};

export default TermsOfUsePage;
