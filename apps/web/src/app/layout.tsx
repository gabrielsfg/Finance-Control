import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantia — Seu dinheiro, organizado",
  description: "Gerencie suas finanças pessoais com inteligência.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bricolage.variable} ${hanken.variable} ${ibmPlexMono.variable} h-full`}
    >
      <head>
        {/* Apply saved theme before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('controle-ui')||'{}');var t=(s.state||{}).theme||'dark';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      {/* Extensions (Grammarly, password managers) inject attributes onto <body>
          before React hydrates, which React reports as a mismatch. The flag on
          <html> doesn't cascade — it only covers one element — so <body> needs
          its own. Scoped to this element's attributes; children still warn. */}
      <body suppressHydrationWarning className="bg-background text-foreground h-full">
        <QueryProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
