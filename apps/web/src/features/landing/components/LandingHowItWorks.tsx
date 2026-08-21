const steps = [
  {
    title: "Crie sua conta",
    body: "A conta já nasce com categorias, subcategorias e uma carteira prontas. Você não abre o app numa tela em branco tendo que configurar tudo antes de usar.",
  },
  {
    title: "Registre o que acontece",
    body: "Um lançamento leva segundos. Se for parcelado ou recorrente, o Quantia cria as parcelas e repete o lançamento nas datas certas por você.",
  },
  {
    title: "Enxergue o mês",
    body: "Saldo, orçamento, metas e patrimônio se recalculam a cada lançamento. Nada de fechar planilha no fim do mês para descobrir o que aconteceu.",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="como-funciona"
      className="border-t border-[var(--border-color)] bg-[var(--surface2)]"
    >
      <div className="mx-auto w-full max-w-[1140px] px-6 py-16 lg:py-20">
        <p className="font-mono text-[10.5px] tracking-[0.22em] text-[var(--text-sub)] uppercase">
          Como funciona
        </p>
        <h2 className="font-display mt-3 max-w-[560px] text-[32px] leading-[1.15] font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-[38px]">
          Três passos, e o resto o app faz sozinho.
        </h2>

        <ol className="stagger mt-11 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-[var(--moss)]/40 pt-5">
              <span className="font-money text-[13px] font-semibold text-[var(--brand-accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-2 text-[19px] font-bold tracking-[-0.01em] text-[var(--text)]">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-[var(--text-sub)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
