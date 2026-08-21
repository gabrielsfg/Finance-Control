import { HeroPanel } from "@/components/shared/HeroPanel";

/**
 * A still of the app's own vocabulary — hero panel, ledger rule, flow bar,
 * budget rows — rather than a screenshot, so it never goes stale against the
 * real UI and stays sharp at any width.
 *
 * The figures are illustrative and labelled as such. Nothing here is presented
 * as a measurement of anything.
 */

const budgetRows = [
  { label: "Moradia", spent: "R$ 2.180", pct: 72, color: "var(--moss)" },
  { label: "Mercado", spent: "R$ 940", pct: 47, color: "var(--brand-accent)" },
  { label: "Transporte", spent: "R$ 610", pct: 88, color: "var(--gold)" },
];

export function AppPreview() {
  return (
    <div className="relative">
      {/* tailwind-merge drops the panel's own p-[30px] and dark-mode border in
          favour of these — sobre a landing branca, o painel não leva borda. */}
      <HeroPanel className="p-[26px] dark:border-transparent">
        <div className="relative z-10">
          <p className="font-mono text-[10px] tracking-[0.22em] text-[var(--panel-muted)] uppercase">
            Patrimônio
          </p>
          <p className="font-money mt-1.5 text-[38px] leading-none font-semibold text-[var(--panel-foreground)]">
            R$ 48.230<span className="text-[var(--panel-muted)]">,00</span>
          </p>

          {/* Entradas × saídas do mês */}
          <div className="mt-6 flex h-[7px] w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full" style={{ width: "62%", background: "var(--moss)" }} />
            <div className="h-full" style={{ width: "38%", background: "var(--clay)" }} />
          </div>
          <div className="mt-2.5 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--panel-muted)]">
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: "var(--moss)" }}
              />
              Entradas
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--panel-muted)]">
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: "var(--clay)" }}
              />
              Saídas
            </span>
          </div>

          <div
            className="my-5 h-px"
            style={{
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 11px)",
            }}
          />

          <p className="font-mono text-[10px] tracking-[0.22em] text-[var(--panel-muted)] uppercase">
            Orçamento do mês
          </p>

          <div className="mt-3.5 flex flex-col gap-3.5">
            {budgetRows.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] text-[var(--panel-foreground)]">{row.label}</span>
                  <span className="font-money text-[12.5px] text-[var(--panel-muted)]">
                    {row.spent}
                  </span>
                </div>
                <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.pct}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </HeroPanel>

      <p className="mt-3 text-center text-[11.5px] text-[var(--text-sub)]">
        Ilustração da interface. Valores meramente demonstrativos.
      </p>
    </div>
  );
}
