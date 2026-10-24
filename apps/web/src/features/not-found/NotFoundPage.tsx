import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";

/**
 * Root 404. Renders straight under the root layout, outside the public layout, so it
 * opts into the light public palette itself. A server component: Next answers it with
 * a real 404 status and a noindex tag, which keeps dead links out of the index.
 */
export function NotFoundPage() {
  return (
    <div className="public-scope bg-background flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <BrandMark />
      <p className="mt-12 font-mono text-[12px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
        Erro 404
      </p>
      <h1 className="font-display mt-3 max-w-[520px] text-[32px] leading-[1.15] font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-[38px]">
        Essa página não existe.
      </h1>
      <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-[var(--text-sub)]">
        O endereço pode ter mudado ou ter sido digitado errado. Seus dados continuam onde estavam.
      </p>
      <Link
        href="/"
        className="bg-brand mt-8 inline-flex items-center justify-center gap-2 rounded-[11px] px-7 py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-cobalt)]/90"
      >
        <ArrowLeft size={16} />
        Voltar para o início
      </Link>
    </div>
  );
}
