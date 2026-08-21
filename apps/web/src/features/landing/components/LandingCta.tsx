import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="border-t border-[var(--border-color)]">
      <div className="mx-auto w-full max-w-[1140px] px-6 py-16 lg:py-20">
        {/* Painel claro com um véu de moss — o fecho tem destaque sem virar
            um bloco verde no fim da página. */}
        <div
          className="relative overflow-hidden rounded-[26px] border border-[var(--border-color)] p-[40px] text-center sm:p-[56px]"
          style={{
            background:
              "radial-gradient(120% 140% at 12% 0%, color-mix(in oklab, var(--moss) 8%, var(--surface)), var(--surface) 62%)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, var(--moss), var(--brand-cobalt) 85%)" }}
          />
          <div className="relative z-10 mx-auto max-w-[560px]">
            <h2 className="font-display text-[30px] leading-[1.14] font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-[36px]">
              Comece hoje. O primeiro lançamento leva menos de um minuto.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-sub)]">
              Crie a conta, confirme o e-mail e o app já está pronto para usar, com categorias e
              carteira configuradas.
            </p>
            <Link
              href="/login?mode=register"
              className="bg-brand mt-8 inline-flex items-center justify-center gap-2 rounded-[11px] px-7 py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-cobalt)]/90"
            >
              Criar conta grátis
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
