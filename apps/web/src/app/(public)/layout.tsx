import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>

      {/* The legal pages have to be reachable from anywhere public, not only from the
          line under the signup button. */}
      <footer className="border-border text-text-muted flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t px-6 py-5 text-[12.5px]">
        <Link href="/terms" className="hover:text-text-sub transition-colors">
          Termos de Uso
        </Link>
        <Link href="/privacy" className="hover:text-text-sub transition-colors">
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
}
