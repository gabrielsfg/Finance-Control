"use client";

import { BarChart2 } from "lucide-react";

type Props = {
  message?: string;
};

export const ChartEmptyState = ({ message = "Nenhum dado disponível para o período" }: Props) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
    <BarChart2 size={32} className="text-text-muted opacity-40" />
    <p className="text-text-muted text-[13px]">{message}</p>
  </div>
);
