import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";

// robots.txt already keeps crawlers out; this covers a private URL that leaks into a
// link somewhere and gets fetched anyway.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
