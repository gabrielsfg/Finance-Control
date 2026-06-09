"use client";

import { Loader2, AlertCircle, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useFiiIndicators } from "@/features/market/hooks/useMarket";
import type { FiiIndicators } from "@/lib/types/market.types";

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  papel: "Papel",
  tijolo: "Tijolo",
  hibrido: "Híbrido",
  fof: "Fundo de Fundos (FoF)",
};

function fmtRatio(n: number | null | undefined): string | null {
  if (n == null) return null;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtYield(n: number | null | undefined): string | null {
  if (n == null) return null;
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

function fmtInt(n: number | null | undefined): string | null {
  if (n == null) return null;
  return n.toLocaleString("pt-BR");
}

function fmtSegmentType(value: string | null): string | null {
  if (!value) return null;
  return SEGMENT_TYPE_LABELS[value.toLowerCase()] ?? value;
}

type Item = { label: string; value: string | null; valueClass?: string };

function MetricGrid({ items }: { items: Item[] }) {
  const present = items.filter((i) => i.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {present.map((i) => (
        <div key={i.label} className="bg-surface2 flex flex-col gap-0.5 rounded-xl px-4 py-3">
          <p className="text-text-muted text-[10px] uppercase tracking-[0.06em]">{i.label}</p>
          <p className={cn("font-money text-text text-[15px] font-semibold", i.valueClass)}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function RowsCard({ title, rows }: { title: string; rows: Item[] }) {
  const present = rows.filter((r) => r.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="border-border rounded-xl border px-4 py-2">
      <p className="text-text-muted mb-1 text-[11px] uppercase tracking-[0.06em]">{title}</p>
      {present.map((r) => (
        <div key={r.label} className="border-border flex items-center justify-between border-b py-2.5 last:border-0">
          <span className="text-text-muted text-[13px]">{r.label}</span>
          <span className={cn("text-text text-right text-[13px] font-medium", r.valueClass)}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Content({ f }: { f: FiiIndicators }) {
  return (
    <div className="flex flex-col gap-4">
      <MetricGrid items={[
        { label: "P/VP", value: fmtRatio(f.priceToNav) },
        { label: "DY (12m)", value: fmtYield(f.dividendYield12m), valueClass: "text-green" },
        { label: "Cota patrimonial", value: f.navPerShare != null ? formatCurrency(f.navPerShare) : null },
        { label: "Preço", value: f.price != null ? formatCurrency(f.price) : null },
      ]} />
      <RowsCard title="Perfil" rows={[
        { label: "Tipo", value: fmtSegmentType(f.segmentType) },
        { label: "Segmento", value: f.segment },
        { label: "Gestão", value: f.managementType },
        { label: "Mandato", value: f.mandate },
        { label: "Investidores", value: fmtInt(f.totalInvestors) },
        { label: "Administrador", value: f.administratorName },
      ]} />
    </div>
  );
}

export function FiiPanel({ ticker }: { ticker: string }) {
  const { data, isLoading, isError } = useFiiIndicators(ticker);

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-1.5">
        <Coins size={13} className="text-orange" />
        <p className="text-text-muted text-[11px] uppercase tracking-[0.06em]">Indicadores do fundo</p>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={22} className="text-green animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle size={28} className="text-red" />
          <p className="text-text-sub text-[14px]">Não foi possível carregar os dados do FII.</p>
          <p className="text-text-muted text-[12px]">
            Verifique se a conta Brapi tem plano Pro ativo e se o token está configurado.
          </p>
        </div>
      )}
      {!isLoading && !isError && data && (
        <>
          <Content f={data} />
          <p className="text-text-muted mt-6 text-center text-[10px]">
            Fonte: Brapi · Atualizado às {new Date(data.fetchedAt).toLocaleString("pt-BR")}
          </p>
        </>
      )}
    </div>
  );
}
