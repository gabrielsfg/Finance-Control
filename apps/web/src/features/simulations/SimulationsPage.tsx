"use client";

import type { ComponentType } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompoundInterestSimulator } from "@/features/simulations/components/CompoundInterestSimulator";
import { RetirementSimulator }       from "@/features/simulations/components/RetirementSimulator";
import { HistoricalSimulator }       from "@/features/simulations/components/HistoricalSimulator";
import { PortfolioSimulator }        from "@/features/simulations/components/PortfolioSimulator";
import { GoalProjection }            from "@/features/simulations/components/GoalProjection";
import { ScenarioComparator }        from "@/features/simulations/components/ScenarioComparator";

export type SimulationSlug =
  | "compound"
  | "retirement"
  | "historical"
  | "portfolio"
  | "goal"
  | "compare";

type SimulationMeta = {
  label: string;
  description: string;
  Component: ComponentType;
};

/** First entry (`compound`) is served by the bare `/simulations` route. */
export const SIMULATIONS: Record<SimulationSlug, SimulationMeta> = {
  compound:   { label: "Juros Compostos",     description: "Projete o crescimento de aportes com juros compostos", Component: CompoundInterestSimulator },
  retirement: { label: "Aposentadoria",        description: "Planeje quanto acumular e quando se aposentar",        Component: RetirementSimulator },
  historical: { label: "Simulação Histórica", description: "Veja como uma carteira teria performado no passado",   Component: HistoricalSimulator },
  portfolio:  { label: "Carteira",            description: "Monte e projete uma carteira de ativos",               Component: PortfolioSimulator },
  goal:       { label: "Projeção de Meta",    description: "Descubra o aporte necessário para alcançar uma meta",   Component: GoalProjection },
  compare:    { label: "Comparar Cenários",   description: "Compare diferentes cenários lado a lado",              Component: ScenarioComparator },
};

export const DEFAULT_SIMULATION: SimulationSlug = "compound";

/**
 * Serves both the bare `/simulations` route (no slug → compound) and the
 * `/simulations/[slug]` route. Each simulator is its own page, selected from
 * the sidebar submenu.
 */
export function SimulationsPage() {
  const params = useParams();
  const raw = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = (raw ?? DEFAULT_SIMULATION) as SimulationSlug;
  const meta = SIMULATIONS[slug];

  if (!meta) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/simulations"
          className="text-text-muted hover:text-text flex w-fit items-center gap-1.5 text-[13px] transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar às simulações
        </Link>
        <div className="border-border bg-surface flex h-64 items-center justify-center rounded-2xl border">
          <p className="text-text-sub text-[14px]">Simulação não encontrada.</p>
        </div>
      </div>
    );
  }

  const Component = meta.Component;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">{meta.label}</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">{meta.description}</p>
      </div>

      <Component />
    </div>
  );
}
