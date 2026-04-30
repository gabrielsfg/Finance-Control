"use client";

import { CompoundInterestSimulator } from "@/features/simulations/components/CompoundInterestSimulator";
import { GoalProjection } from "@/features/simulations/components/GoalProjection";

export function SimulationsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Simulações</h1>
        <p className="text-text-muted mt-0.5 text-[13px]">Projete seu futuro financeiro</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CompoundInterestSimulator />
        <GoalProjection />
      </div>
    </div>
  );
}
