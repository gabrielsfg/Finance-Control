"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Sun, Moon, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useActiveBudget } from "@/features/budgets/hooks/useActiveBudget";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useInvestments } from "@/features/investments/hooks/useInvestments";
import { useAuthStore } from "@/lib/stores/authStore";
import { MonthlyEvolutionChart } from "@/features/dashboard/components/MonthlyEvolutionChart";
import { SpendingPredictionChart } from "@/features/dashboard/components/SpendingPredictionChart";
import { CategoryDonutChart } from "@/features/dashboard/components/CategoryDonutChart";
import { AiInsightCard } from "@/features/dashboard/components/AiInsightCard";
import { UpcomingBillsCard } from "@/features/dashboard/components/UpcomingBillsCard";
import { useUIStore } from "@/lib/stores/uiStore";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { TransactionDrawer } from "@/features/transactions/components/TransactionDrawer";
import { parseLocalDate } from "@/lib/utils/budgetPeriod";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { AccountItem } from "@/lib/types/accounts.types";
import type { Goal } from "@/lib/types/goal.types";
import type { BudgetSummary, RecentTransaction } from "@/lib/types/dashboard.types";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: isoDate(start), finishDate: isoDate(end) };
}

function toInclusiveEnd(exclusiveEndIso: string): string {
  const d = new Date(exclusiveEndIso);
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

function fmtMoney(cents: number) {
  const value = Math.abs(cents / 100);
  const [int, dec] = value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }).split(",");
  return { int, dec };
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Checking: "#1F3CE0",
  Savings:  "#2C6B57",
  Cash:     "#C8932B",
  Credit:   "#B0451F",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  Checking: "Conta corrente",
  Savings:  "Poupança",
  Cash:     "Dinheiro",
  Credit:   "Cartão de crédito",
};

const TX_CATEGORY_COLORS: Record<string, string> = {
  Alimentação:   "#C8932B",
  Moradia:       "#1F3CE0",
  Transporte:    "#2C6B57",
  Lazer:         "#8197FF",
  Saúde:         "#B0451F",
  Educação:      "#E3B65A",
  Investimentos: "#5FC6A0",
  Receita:       "#2C6B57",
  Transferência: "#6B6657",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function BigMoney({ cents, className, style }: { cents: number; className?: string; style?: React.CSSProperties }) {
  const { int, dec } = fmtMoney(cents);
  return (
    <span className={cn("font-mono tabular-nums", className)} style={style}>
      <span className="text-[0.34em] opacity-60 mr-[0.16em] align-[0.42em]">R$</span>
      {int}
      <span className="text-[0.42em] text-[--panel-muted]">,{dec}</span>
    </span>
  );
}

function Money({
  cents,
  sign,
  className,
}: {
  cents: number;
  sign?: boolean;
  className?: string;
}) {
  const neg = cents < 0;
  const { int, dec } = fmtMoney(cents);
  return (
    <span
      className={cn(
        "font-mono tabular-nums font-medium tracking-[-0.01em]",
        neg ? "text-[--clay]" : sign ? "text-[--moss]" : "text-[--text]",
        className,
      )}
    >
      <span className="text-[0.62em] opacity-70 mr-[0.18em] align-[0.06em]">R$</span>
      {neg ? "− " : sign ? "+ " : ""}
      {int}
      <span className="text-[0.66em] opacity-70">,{dec}</span>
    </span>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[--border-color] bg-[--surface] p-[22px]",
        className,
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

function CardHead({
  title,
  href,
  linkLabel = "Ver tudo",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  const router = useRouter();
  return (
    <div className="mb-4 flex items-center gap-2">
      <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[--text]">
        {title}
      </h3>
      {href && (
        <button
          onClick={() => router.push(href)}
          className="ml-auto font-mono text-[11px] tracking-[0.1em] uppercase text-[--brand-accent] hover:underline"
        >
          {linkLabel}
        </button>
      )}
    </div>
  );
}

function FlowBar({ pct, variant }: { pct: number; variant: "in" | "out" }) {
  const to = Math.min(1, Math.max(0, pct));
  return (
    <div className="h-[14px] overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className={cn(
          "flow-fill h-full rounded-full",
          variant === "in"
            ? "bg-gradient-to-r from-[--moss] to-[--moss-lift]"
            : "bg-gradient-to-r from-[--clay] to-[--clay-lift]",
        )}
        style={{ "--to": to } as React.CSSProperties}
      />
    </div>
  );
}

// ── Accounts card ──────────────────────────────────────────────────────────────

function AccountsCard({ accounts }: { accounts: AccountItem[] }) {
  const router = useRouter();
  const visible = accounts.slice(0, 5);
  return (
    <Card>
      <CardHead title="Contas" href="/accounts" linkLabel="Gerenciar" />
      <div className="flex flex-col">
        {visible.map((acct, i) => {
          const color = ACCOUNT_TYPE_COLORS[acct.type] ?? "#6B6657";
          const label = ACCOUNT_TYPE_LABELS[acct.type] ?? acct.type;
          const isCredit = acct.type === "Credit";
          const abbr = acct.name.slice(0, 2).toUpperCase();
          return (
            <div
              key={acct.id}
              className={cn(
                "flex items-center gap-3 py-3",
                i < visible.length - 1 && "border-b border-[--border-color]",
              )}
            >
              <div
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] font-mono text-[13px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {abbr}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[--text] truncate">{acct.name}</div>
                <div className="font-mono text-[11px] text-[--text-sub] tracking-[0.04em]">{label}</div>
              </div>
              <div className="text-right">
                <Money
                  cents={acct.currentAmount}
                  className={cn("text-[15px]", isCredit && acct.currentAmount < 0 && "text-[--clay]")}
                />
                <div className="font-mono text-[10.5px] text-[--text-sub] uppercase tracking-[0.1em] mt-0.5">
                  {isCredit ? "A pagar" : "Disponível"}
                </div>
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <p className="py-6 text-center font-mono text-[13px] text-[--text-sub]">
            Nenhuma conta cadastrada
          </p>
        )}
      </div>
    </Card>
  );
}

// ── Transactions card ──────────────────────────────────────────────────────────

function TransactionsCard({ transactions }: { transactions: RecentTransaction[] }) {
  const router = useRouter();
  const visible = transactions.slice(0, 7);
  return (
    <Card>
      <CardHead title="Movimentações recentes" href="/transactions" linkLabel="Ver extrato" />
      <div className="flex flex-col">
        {visible.map((tx, i) => {
          const color = TX_CATEGORY_COLORS[tx.categoryName] ?? "#6B6657";
          const isIncome = tx.type === "Income";
          const isTransfer = tx.type === "Transfer";
          return (
            <div
              key={tx.id}
              className={cn(
                "flex items-center gap-3 py-[11px]",
                i < visible.length - 1 && "border-b border-[--border-color]",
              )}
            >
              <div
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-[15px]"
                style={{
                  backgroundColor: isIncome
                    ? "color-mix(in srgb, var(--moss) 14%, transparent)"
                    : isTransfer
                      ? "color-mix(in srgb, var(--brand-cobalt) 14%, transparent)"
                      : `${color}22`,
                  color: isIncome ? "var(--moss)" : isTransfer ? "var(--brand-cobalt)" : color,
                }}
              >
                {tx.subCategoryEmoji ?? (isIncome ? "↑" : isTransfer ? "⇄" : "↓")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-[--text] truncate">{tx.description}</div>
                <div className="font-mono text-[11px] text-[--text-sub]">{tx.categoryName}</div>
              </div>
              <div className="shrink-0 w-[100px] text-right">
                <Money
                  cents={isIncome ? tx.value : -Math.abs(tx.value)}
                  sign={isIncome}
                  className="text-[14.5px]"
                />
              </div>
            </div>
          );
        })}
        {transactions.length === 0 && (
          <p className="py-6 text-center font-mono text-[13px] text-[--text-sub]">
            Nenhuma transação este período
          </p>
        )}
      </div>
    </Card>
  );
}

// ── Investments card ───────────────────────────────────────────────────────────

function InvestmentsCard({ portfolio }: { portfolio: InvestmentPortfolio | undefined }) {
  const router = useRouter();
  const top = (portfolio?.investments ?? []).slice(0, 4);
  const dayChange = top.reduce((sum, i) => sum + i.dayChangeAbs, 0);

  return (
    <Card>
      <CardHead title="Carteira" href="/investments" linkLabel="Investimentos" />
      {portfolio ? (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <Money cents={portfolio.currentValue} className="text-[26px]" />
            <span
              className={cn(
                "font-mono text-[13px] font-medium",
                dayChange >= 0 ? "text-[--moss]" : "text-[--clay]",
              )}
            >
              {dayChange >= 0 ? "+" : "−"} {formatCurrency(Math.abs(dayChange / 100))} hoje
            </span>
          </div>
          <div className="my-[14px] h-px bg-[repeating-linear-gradient(90deg,var(--border-color)_0_6px,transparent_6px_11px)]" />
          {top.map((inv, i) => (
            <div
              key={inv.id}
              className={cn(
                "flex items-center gap-3 py-[10px]",
                i < top.length - 1 && "border-b border-[--border-color]",
              )}
            >
              <span className="font-mono text-[13px] font-semibold text-[--text] w-[64px]">
                {inv.ticker}
              </span>
              <span className="flex-1 truncate text-[13px] text-[--text-sub]">{inv.name}</span>
              <span className="font-mono text-[13px] w-[72px] text-right text-[--text]">
                {formatCurrency(inv.currentPrice / 100)}
              </span>
              <span
                className={cn(
                  "font-mono text-[12px] font-medium w-[54px] text-right",
                  inv.dayChangePct >= 0 ? "text-[--moss]" : "text-[--clay]",
                )}
              >
                {inv.dayChangePct >= 0 ? "+" : ""}
                {inv.dayChangePct.toFixed(1)}%
              </span>
            </div>
          ))}
          {top.length === 0 && (
            <p className="py-4 text-center font-mono text-[13px] text-[--text-sub]">
              Nenhum ativo na carteira
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <p className="font-mono text-[13px] text-[--text-sub]">Carregando carteira…</p>
        </div>
      )}
    </Card>
  );
}

// ── Goals card ─────────────────────────────────────────────────────────────────

function GoalsCard({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const active = goals.filter((g) => g.status === "Active").slice(0, 3);

  return (
    <Card>
      <CardHead title="Metas" href="/goals" linkLabel="Todas" />
      {active.length === 0 ? (
        <p className="py-4 text-center font-mono text-[13px] text-[--text-sub]">Sem metas ativas</p>
      ) : (
        active.map((goal, i) => {
          const current = goal.currentAmount ?? 0;
          const target = goal.targetAmount;
          const pct = target > 0 ? Math.min(1, current / target) : 0;
          const pctDisplay = Math.round(pct * 100);
          const color = goal.color ?? "var(--brand-cobalt)";
          const liftColor = goal.color ? `${goal.color}99` : "var(--cobalt-lift)";

          return (
            <div
              key={goal.id}
              className={cn("py-[14px]", i < active.length - 1 && "border-b border-[--border-color]")}
            >
              <div className="mb-[9px] flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-[--text]">{goal.name}</span>
                <span
                  className="font-mono text-[13px] font-semibold"
                  style={{ color }}
                >
                  {pctDisplay}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[--surface2]">
                <div
                  className="flow-fill h-full rounded-full"
                  style={{
                    "--to": pct,
                    background: `linear-gradient(90deg, ${color}, ${liftColor})`,
                  } as React.CSSProperties}
                />
              </div>
              <div className="mt-2 flex justify-between">
                <span className="font-mono text-[12.5px] text-[--text-sub]">
                  <strong className="text-[--text]">{formatCurrency(current / 100)}</strong>
                  {" / "}
                  {formatCurrency(target / 100)}
                </span>
                {goal.targetDate && (
                  <span className="font-mono text-[12.5px] text-[--text-sub]">
                    {format(parseLocalDate(goal.targetDate), "MMM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}

// ── Budget card ────────────────────────────────────────────────────────────────

function BudgetCard({ budget }: { budget: BudgetSummary | null }) {
  const router = useRouter();

  if (!budget || !budget.hasAllocations) {
    return (
      <Card>
        <CardHead title="Orçamento" />
        <p className="py-4 text-center font-mono text-[13px] text-[--text-sub]">
          {budget ? "Sem categorias alocadas" : "Nenhum orçamento"}
        </p>
      </Card>
    );
  }

  const cats = budget.topSubCategories.slice(0, 4);

  return (
    <Card>
      <CardHead title="Orçamento" href="/budgets" />
      {cats.map((cat, i) => {
        const color = getCategoryColor(cat.categoryColor, cat.categoryName);
        const pct = Math.min(1, cat.spentPercentage / 100);
        const over = cat.spentPercentage > 100;
        return (
          <div
            key={cat.subCategoryName}
            className={cn("py-3", i < cats.length - 1 && "border-b border-[--border-color]")}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13.5px] font-medium text-[--text]">{cat.subCategoryName}</span>
              <span
                className={cn("font-mono text-[12px]", over ? "text-[--clay]" : "text-[--text-sub]")}
              >
                <strong className={over ? "text-[--clay]" : "text-[--text]"}>
                  {formatCurrency(cat.spent / 100)}
                </strong>
                {" / "}
                {formatCurrency(cat.allocated / 100)}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-[--surface2]">
              <div
                className="flow-fill h-full rounded-full"
                style={{
                  "--to": pct,
                  backgroundColor: over ? "var(--clay)" : color,
                } as React.CSSProperties}
              />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: activeBudget } = useActiveBudget();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const range = activeBudget
    ? { startDate: activeBudget.startDate, finishDate: toInclusiveEnd(activeBudget.endDate) }
    : getCurrentMonthRange();

  const periodLabel = activeBudget
    ? `${format(parseLocalDate(activeBudget.startDate), "d MMM", { locale: ptBR })} – ${format(parseLocalDate(activeBudget.endDate), "d MMM yyyy", { locale: ptBR })}`
    : format(new Date(), "MMMM yyyy", { locale: ptBR });

  const { data, isLoading } = useDashboard({ ...range, budgetId: activeBudget?.budget.id });
  const { data: accounts = [] } = useAccounts();
  const { data: goalsData } = useGoals({ status: "Active" });
  const { data: investments } = useInvestments();

  // Animate flow bars and goal bars on load
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.body.classList.add("is-loaded");
    });
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("is-loaded");
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="font-mono text-[13px] text-[--text-sub]">Carregando…</div>
      </div>
    );
  }

  const { balanceSummary, recentTransactions, budgetSummary, topCategories, spendingPrediction } = data ?? {
    balanceSummary: { netWorth: 0, totalIncome: 0, totalExpenses: 0, balance: 0 },
    recentTransactions: [],
    budgetSummary: null,
    topCategories: [],
    spendingPrediction: [],
  };

  const netWorth     = balanceSummary.netWorth ?? 0;
  const totalIncome  = balanceSummary.totalIncome;
  const totalExpenses= balanceSummary.totalExpenses;
  const periodBalance= balanceSummary.balance;
  const netWorthDelta= balanceSummary.netWorthChange;

  const incomePct  = 1;
  const expensePct = totalIncome > 0 ? totalExpenses / totalIncome : 0;

  // Compute mini-stats from accounts and investments
  const liquidBalance = accounts
    .filter((a) => a.type !== "Credit")
    .reduce((sum, a) => sum + a.currentAmount, 0);
  const creditDebt = accounts
    .filter((a) => a.type === "Credit")
    .reduce((sum, a) => sum + Math.min(0, a.currentAmount), 0);
  const investedValue = investments?.currentValue ?? 0;

  const monthName = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const firstName = user?.name?.split(" ")[0] ?? "usuário";

  const savingsRate = totalIncome > 0
    ? Math.round((periodBalance / totalIncome) * 100)
    : 0;

  const goals = goalsData ?? [];

  return (
    <div className="min-h-full px-[clamp(20px,3.4vw,46px)] pb-[60px]">

      {/* ── Topbar ── */}
      <header className="flex items-end gap-5 pt-[26px] pb-[30px]">
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--text-sub]">
            Demonstrativo · {monthName}
          </div>
          <h1 className="font-display mt-[6px] text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.025em] leading-[1.02] text-[--text]">
            Olá, {firstName}
          </h1>
          {savingsRate > 0 && (
            <p className="mt-[6px] text-[14px] text-[--text-sub]">
              Seu mês está positivo — você guardou{" "}
              <strong className="text-[--text]">{savingsRate}%</strong> do que entrou.
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <GlobalSearch />

          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            title="Alternar tema"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] border transition-all hover:-translate-y-[1px]"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
          >
            {theme === "dark" ? (
              <Sun size={19} strokeWidth={1.7} className="text-[--text]" />
            ) : (
              <Moon size={19} strokeWidth={1.7} className="text-[--text]" />
            )}
          </button>

          <NotificationBell />

          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-[42px] items-center gap-2 rounded-[13px] px-[18px] text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
            style={{
              background: "var(--brand-cobalt)",
              boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)",
            }}
          >
            <Plus size={17} strokeWidth={2} />
            Nova transação
          </button>
        </div>
      </header>

      {/* ── 12-col editorial grid ── */}
      <div className="grid grid-cols-12 gap-[22px]">

        {/* ── Hero panel (full width) ── */}
        <section
          className="relative col-span-12 overflow-hidden rounded-[26px] p-[30px]"
          style={{
            background: "radial-gradient(120% 140% at 8% 0%, var(--panel-2), var(--panel) 60%)",
            boxShadow: "var(--shadow-md)",
            color: "var(--panel-foreground)",
          }}
        >
          {/* Azulejo echo */}
          <div className="pointer-events-none absolute -right-[46px] -top-[46px] h-[230px] w-[230px] opacity-10">
            <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
              <rect width="36" height="36" rx="9" fill="#fff" />
              <path d="M0 9C0 4 4 0 9 0H18A18 18 0 0 1 0 18Z" fill="#17211D" />
              <path d="M36 27c0 5-4 9-9 9H18A18 18 0 0 1 36 18Z" fill="#17211D" />
            </svg>
          </div>

          <div className="grid grid-cols-[1.05fr_1.25fr] gap-[34px]">
            {/* Left — patrimônio */}
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--panel-muted]">
                Patrimônio total
              </div>
              <BigMoney
                cents={netWorth}
                className="block mt-[10px] mb-[2px] font-semibold leading-[0.96] tracking-[-0.035em]"
                style={{ fontSize: "clamp(44px, 6.4vw, 78px)" } as React.CSSProperties}
              />

              {/* Delta chip */}
              {netWorthDelta !== undefined && (
                <div className="mt-2 inline-flex items-center gap-[7px] font-mono text-[13px] font-medium">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[--moss-lift]"
                    style={{ background: "rgba(95,198,160,0.15)" }}
                  >
                    <ArrowUpRight size={13} strokeWidth={2.4} />
                    {netWorthDelta > 0 ? "+" : ""}{netWorthDelta.toFixed(1)}%
                  </span>
                  <span className="text-[--panel-muted]">vs. mês anterior</span>
                </div>
              )}

              {/* Mini-stats */}
              <div className="mt-6 flex gap-[26px]">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--panel-muted]">Em conta</div>
                  <div className="font-mono mt-[3px] text-[18px] font-medium">
                    {formatCurrency(liquidBalance / 100)}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--panel-muted]">Investido</div>
                  <div className="font-mono mt-[3px] text-[18px] font-medium">
                    {formatCurrency(investedValue / 100)}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--panel-muted]">Saldo do mês</div>
                  <div
                    className="font-mono mt-[3px] text-[18px] font-medium"
                    style={{ color: periodBalance >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
                  >
                    {formatCurrency(periodBalance / 100)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — fluxo */}
            <div className="self-center">
              <div className="mb-[18px] flex items-baseline justify-between">
                <span className="font-display text-[16px] font-bold">Fluxo do mês</span>
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[--panel-muted]">
                  {periodLabel}
                </span>
              </div>

              {/* Entradas */}
              <div className="my-[15px]">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-medium">
                    <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: "var(--moss-lift)" }} />
                    Entradas
                  </span>
                  <span className="font-mono text-[14px] font-medium text-[--moss-lift]">
                    + {formatCurrency(totalIncome / 100)}
                  </span>
                </div>
                <FlowBar pct={incomePct} variant="in" />
              </div>

              {/* Saídas */}
              <div className="my-[15px]">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-medium">
                    <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: "var(--clay-lift)" }} />
                    Saídas
                  </span>
                  <span className="font-mono text-[14px] font-medium text-[--clay-lift]">
                    − {formatCurrency(totalExpenses / 100)}
                  </span>
                </div>
                <FlowBar pct={expensePct} variant="out" />
              </div>

              {/* Net */}
              <div
                className="mt-5 flex items-center justify-between border-t pt-4"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[--panel-muted]">
                  Saldo do mês
                </span>
                <span
                  className="font-mono text-[22px] font-semibold"
                  style={{ color: periodBalance >= 0 ? "var(--moss-lift)" : "var(--clay-lift)" }}
                >
                  {periodBalance >= 0 ? "+ " : "− "}
                  {formatCurrency(Math.abs(periodBalance / 100))}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Row 2: Transactions (7) + Accounts (5) ── */}
        <div className="col-span-7">
          <TransactionsCard transactions={recentTransactions} />
        </div>
        <div className="col-span-5">
          <AccountsCard accounts={accounts} />
        </div>

        {/* ── Row 3: Investments (5) + Goals (4) + Budget (3) ── */}
        <div className="col-span-5">
          <InvestmentsCard portfolio={investments} />
        </div>
        <div className="col-span-4">
          <GoalsCard goals={goals} />
        </div>
        <div className="col-span-3">
          <BudgetCard budget={budgetSummary ?? null} />
        </div>

      </div>

      {/* ── Charts section (preserved from previous design) ── */}
      <div className="mt-[22px] flex flex-col gap-[22px]">
        <SpendingPredictionChart data={spendingPrediction ?? []} />

        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1fr_340px]">
          <MonthlyEvolutionChart />
          <CategoryDonutChart categories={topCategories ?? []} />
        </div>

        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1fr_340px]">
          <UpcomingBillsCard />
          <AiInsightCard />
        </div>
      </div>

      {/* Nova transação drawer */}
      <TransactionDrawer
        open={drawerOpen}
        mode="create"
        onClose={() => setDrawerOpen(false)}
        onDeleteRequest={() => {}}
      />
    </div>
  );
}
