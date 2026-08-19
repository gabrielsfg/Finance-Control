import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";

const sections = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#seguranca", label: "Segurança" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1140px] items-center px-6">
        <BrandMark />

        <nav className="mx-auto hidden items-center gap-8 md:flex">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="text-[14px] text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/login"
            className="rounded-[9px] px-3.5 py-2 text-[14px] font-medium text-[var(--text-sub)] transition-colors hover:text-[var(--text)]"
          >
            Entrar
          </Link>
          <Link
            href="/login?mode=register"
            className="bg-brand rounded-[9px] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--brand-cobalt)]/90"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
