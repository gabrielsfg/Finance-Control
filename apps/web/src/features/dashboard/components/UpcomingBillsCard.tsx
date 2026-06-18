"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type Bill = {
  id: number;
  description: string;
  emoji: string;
  daysUntilDue: number;
  amount: number;
};

const PLACEHOLDER_BILLS: Bill[] = [
  { id: 1, description: "Aluguel",        emoji: "🏠", daysUntilDue: 3,  amount: 180000 },
  { id: 2, description: "Energia",        emoji: "⚡", daysUntilDue: 7,  amount:  23500 },
  { id: 3, description: "Internet",       emoji: "📡", daysUntilDue: 10, amount:  9990 },
  { id: 4, description: "Streaming",      emoji: "🎬", daysUntilDue: 14, amount:  5590 },
  { id: 5, description: "Cartão Nubank",  emoji: "💳", daysUntilDue: 18, amount: 84700 },
  { id: 6, description: "Plano de Saúde", emoji: "🏥", daysUntilDue: 22, amount: 32000 },
];

function DueBadge({ days }: { days: number }) {
  const urgent = days <= 5;
  const soon   = days <= 10;
  const cls = urgent
    ? "bg-red/10 text-red border-red/30"
    : soon
    ? "bg-orange/10 text-orange border-orange/30"
    : "bg-surface3 text-text-sub border-border";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `${days}d`}
    </span>
  );
}

type Props = {
  bills?: Bill[];
};

export const UpcomingBillsCard = ({ bills = PLACEHOLDER_BILLS }: Props) => {
  const total = bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="border-[var(--border-color)] bg-[var(--surface)] rounded-[20px] border p-[22px]">
      <div className="mb-4 flex items-center gap-[10px]">
        <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">Próximas contas a pagar</h3>
        <span className="font-mono text-[11px] text-[var(--text-sub)]">{bills.length} pendentes</span>
        <Link href="/recurring" className="ml-auto font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-accent)] hover:underline">
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="border-[var(--border-color)] bg-[var(--surface2)] flex flex-col gap-2 rounded-[13px] border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[18px]">{bill.emoji}</span>
              <DueBadge days={bill.daysUntilDue} />
            </div>
            <p className="text-[var(--text)] truncate text-[12px] font-medium">{bill.description}</p>
            <p className="font-mono font-semibold text-[var(--text)] text-[13px]">
              {formatCurrency(bill.amount / 100)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--text-sub)]">Total comprometido</span>
        <span className="font-mono font-semibold text-[var(--text)] text-[14px]">
          {formatCurrency(total / 100)}
        </span>
      </div>
    </div>
  );
};
