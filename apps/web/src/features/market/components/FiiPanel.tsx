"use client";

import { Loader2, AlertCircle, Coins } from "lucide-react";
import { Card } from "@/components/shared/Card";
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
        <div key={i.label} className="flex flex-col gap-0.5 rounded-[13px] bg-[var(--surface2)] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-sub)]">{i.label}</p>
          <p className={cn("font-mono text-[15px] font-semibold tabular-nums text-[var(--text)]", i.valueClass)}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function RowsCard({ title, rows }: { title: string; rows: Item[] }) {
  const present = rows.filter((r) => r.value !== null);
  if (present.length === 0) return null;
  return (
    <div className="rounded-[13px] border border-[var(--border-color)] px-4 py-2">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">{title}</p>
      {present.map((r) => (
        <div key={r.label} className="flex items-center justify-between border-b border-[var(--border-color)] py-2.5 last:border-0">
          <span className="text-[13px] text-[var(--text-sub)]">{r.label}</span>
          <span className={cn("text-right text-[13px] font-medium text-[var(--text)]", r.valueClass)}>{r.value}</span>
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
        { label: "DY (12m)", value: fmtYield(f.dividendYield12m), valueClass: "text-[var(--moss)]" },
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
    <Card>
      <div className="mb-4 flex items-center gap-1.5">
        <Coins size={13} className="text-[var(--gold)]" />
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-sub)]">Indicadores do fundo</p>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle size={28} className="text-[var(--clay)]" />
          <p className="text-[14px] text-[var(--text-sub)]">Não foi possível carregar os dados do FII.</p>
          <p className="text-[12px] text-[var(--text-sub)]">
            Verifique se a conta Brapi tem plano Pro ativo e se o token está configurado.
          </p>
        </div>
      )}
      {!isLoading && !isError && data && (
        <>
          <Content f={data} />
          <p className="mt-6 text-center font-mono text-[10px] tracking-[0.04em] text-[var(--text-sub)]">
            Fonte: Brapi · Atualizado às {new Date(data.fetchedAt).toLocaleString("pt-BR")}
          </p>
        </>
      )}
    </Card>
  );
}
