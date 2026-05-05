"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CompoundInterestSimulator } from "@/features/simulations/components/CompoundInterestSimulator";
import { GoalProjection }            from "@/features/simulations/components/GoalProjection";
import { HistoricalSimulator }       from "@/features/simulations/components/HistoricalSimulator";
import { ScenarioComparator }        from "@/features/simulations/components/ScenarioComparator";

type Tab = "compound" | "historical" | "goal" | "compare";

const TABS: { id: Tab; label: string; subtitle: string }[] = [
  { id: "compound",   label: "Juros Compostos",    subtitle: "Com tributação por ativo"      },
  { id: "historical", label: "Simulação Histórica", subtitle: "Dados reais do Banco Central" },
  { id: "goal",       label: "Projeção de Meta",    subtitle: "Rendimento líquido"           },
  { id: "compare",    label: "Comparar Cenários",   subtitle: "Até 4 estratégias"            },
];

export function SimulationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("compound");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Simulações</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">Projete seu futuro financeiro com dados reais</p>
      </div>

      {/* Tab bar */}
      <div className="border-border bg-surface rounded-xl border p-1.5">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-start rounded-lg px-3 py-2.5 transition-colors text-left",
                activeTab === tab.id
                  ? "bg-green/10 text-green"
                  : "text-text-muted hover:text-text hover:bg-surface2"
              )}
            >
              <span className={cn("text-[13px] font-medium leading-tight", activeTab === tab.id ? "text-green" : "text-text")}>
                {tab.label}
              </span>
              <span className="text-[11px] mt-0.5 leading-tight opacity-70">{tab.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "compound"   && <CompoundInterestSimulator />}
        {activeTab === "historical" && <HistoricalSimulator />}
        {activeTab === "goal"       && <GoalProjection />}
        {activeTab === "compare"    && <ScenarioComparator />}
      </div>
    </div>
  );
}
