import {
  ArrowLeftRight,
  BarChart3,
  Calculator,
  Goal,
  PieChart,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    icon: Wallet,
    title: "Contas e cartões",
    body: "Corrente, poupança, crédito e dinheiro. O saldo é calculado a partir das transações — nunca digitado à mão, nunca desatualizado.",
  },
  {
    icon: ArrowLeftRight,
    title: "Lançamentos como a vida é",
    body: "Parcelamento, recorrência e transferência entre contas. Marque com tags e filtre depois por período, categoria, conta ou valor.",
  },
  {
    icon: PieChart,
    title: "Orçamento por área",
    body: "Defina quanto pode sair de cada área e subcategoria no mês. O consumido se atualiza sozinho a cada lançamento.",
  },
  {
    icon: Goal,
    title: "Metas",
    body: "Quanto falta, quanto já foi e em quanto tempo você chega lá mantendo o ritmo atual.",
  },
  {
    icon: TrendingUp,
    title: "Investimentos e mercado",
    body: "Posições, alocação e rentabilidade da carteira — com cotações de ações, FIIs, ETFs, BDRs, Tesouro, cripto e moedas.",
  },
  {
    icon: BarChart3,
    title: "Análises",
    body: "Patrimônio, gastos, taxa de poupança e projeções, construídos sobre o histórico que você já lançou.",
  },
];

const extras = [
  "Simulador de juros compostos",
  "Projeção de aposentadoria",
  "Comparador de cenários",
  "Recorrências e lembretes",
  "Alertas de ativos",
  "Exportação em CSV",
  "Tema claro e escuro",
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="border-t border-[var(--border-color)]">
      <div className="mx-auto w-full max-w-[1140px] px-6 py-16 lg:py-20">
        <p className="font-mono text-[10.5px] tracking-[0.22em] text-[var(--text-sub)] uppercase">
          Recursos
        </p>
        <h2 className="font-display mt-3 max-w-[620px] text-[32px] leading-[1.15] font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-[38px]">
          O suficiente para o mês fechar. Fundo o bastante para o ano fazer sentido.
        </h2>

        <div className="stagger mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[22px] transition-colors hover:border-[var(--brand-cobalt)]/45"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
                style={{
                  background: "color-mix(in oklab, var(--brand-cobalt) 12%, transparent)",
                  color: "var(--brand-accent)",
                }}
              >
                <feature.icon size={18} strokeWidth={2} />
              </div>
              <h3 className="font-display mt-4 text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-sub)]">
                {feature.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-sub)]">
            <Calculator size={14} />E ainda:
          </span>
          {extras.map((extra) => (
            <span
              key={extra}
              className="rounded-full border border-[var(--border-color)] bg-[var(--surface2)] px-3 py-1 text-[12.5px] text-[var(--text-sub)]"
            >
              {extra}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
