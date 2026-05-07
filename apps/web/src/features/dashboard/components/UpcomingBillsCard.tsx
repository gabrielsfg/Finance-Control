"use client";

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
    <div className="border-border bg-surface rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display font-600 text-text text-[15px]">Próximas contas a pagar</p>
        <span className="text-text-muted text-[12px]">{bills.length} pendentes</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="border-border bg-surface2 flex flex-col gap-2 rounded-xl border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[18px]">{bill.emoji}</span>
              <DueBadge days={bill.daysUntilDue} />
            </div>
            <p className="text-text truncate text-[12px] font-medium">{bill.description}</p>
            <p className="font-money font-600 text-text text-[13px]">
              {formatCurrency(bill.amount / 100)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-border/50 mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-text-muted text-[12px]">Total comprometido</span>
        <span className="font-money font-600 text-text text-[14px]">
          {formatCurrency(total / 100)}
        </span>
      </div>
    </div>
  );
};
