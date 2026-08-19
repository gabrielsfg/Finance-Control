import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroPanel } from "@/components/shared/HeroPanel";

export function LandingCta() {
  return (
    <section className="border-t border-[var(--border-color)]">
      <div className="mx-auto w-full max-w-[1140px] px-6 py-16 lg:py-20">
        <HeroPanel className="p-[40px] text-center sm:p-[56px]">
          <div className="relative z-10 mx-auto max-w-[560px]">
            <h2 className="font-display text-[30px] leading-[1.14] font-extrabold tracking-[-0.03em] text-[var(--panel-foreground)] sm:text-[36px]">
              Comece hoje. O primeiro lançamento leva menos de um minuto.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--panel-muted)]">
              Crie a conta, confirme o e-mail e o app já está pronto para usar — com categorias e
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
        </HeroPanel>
      </div>
    </section>
  );
}
