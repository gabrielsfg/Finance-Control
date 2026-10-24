import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/features/legal/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Quantia coleta, usa, armazena e protege os seus dados pessoais, e como exercer os seus direitos pela LGPD.",
  alternates: { canonical: "/privacy" },
};

export default PrivacyPolicyPage;
