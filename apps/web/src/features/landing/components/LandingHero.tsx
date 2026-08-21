import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppPreview } from "@/features/landing/components/AppPreview";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Lavagem de fundo bem discreta — cobalto em cima, moss à direita, os
          dois fracos o bastante para o hero continuar lendo como branco. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 18% -12%, color-mix(in oklab, var(--brand-cobalt) 7%, transparent), transparent), radial-gradient(ellipse 46% 38% at 96% 12%, color-mix(in oklab, var(--moss) 6%, transparent), transparent)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1140px] items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="anim-rise">
          <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-3 py-1 font-mono text-[10.5px] tracking-[0.18em] text-[var(--text-sub)] uppercase">
            Controle financeiro pessoal
          </span>

          <h1 className="font-display mt-5 text-[42px] leading-[1.06] font-extrabold tracking-[-0.035em] text-[var(--text)] sm:text-[54px]">
            Cada real que entra, <span className="text-[var(--brand-accent)]">sai e rende</span> em
            um lugar só.
          </h1>

          <p className="mt-5 max-w-[520px] text-[16.5px] leading-relaxed text-[var(--text-sub)]">
            O Quantia junta contas, cartões, orçamento, metas e investimentos na mesma tela. Você
            lança uma vez e enxerga o mês inteiro, sem planilha e sem quebra-cabeça no fim do mês.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login?mode=register"
              className="bg-brand inline-flex items-center justify-center gap-2 rounded-[11px] px-6 py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-cobalt)]/90"
            >
              Criar conta grátis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-[11px] border border-[var(--border-color)] bg-[var(--surface)] px-6 py-[15px] text-[15px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface2)]"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-[var(--text-sub)]">
            Grátis para usar. Sem cartão de crédito.
          </p>
        </div>

        <div className="anim-rise [--anim-delay:120ms] lg:pl-4">
          <AppPreview />
        </div>
      </div>
    </section>
  );
}
