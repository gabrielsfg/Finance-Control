import type { Metadata } from "next";
import { OAuthConsentPage } from "@/features/mcp/OAuthConsentPage";

export const metadata: Metadata = {
  title: "Autorizar acesso",
  robots: { index: false, follow: false },
};

export default OAuthConsentPage;
