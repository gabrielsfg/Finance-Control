"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";
import { categoriesApi } from "@/lib/api/categories";
import { investmentsApi } from "@/lib/api/investments";
import { transactionsApi } from "@/lib/api/transactions";
import { useMarketSearch } from "@/features/market/hooks/useMarket";
import {
  Search,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  Tag,
  FolderOpen,
  LayoutDashboard,
  Clock,
  BarChart3,
  Target,
  Calculator,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeaderStore } from "@/lib/stores/headerStore";
import { getCategoryColor } from "@/lib/config/categoryColors";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { TransactionItem } from "@/lib/types/transactions.types";
import type { InvestmentPortfolio } from "@/lib/types/investments.types";
import type { AccountItem } from "@/lib/types/accounts.types";
import type { Category } from "@/lib/types/categories.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultKind =
  | "page"
  | "transaction"
  | "investment"
  | "account"
  | "category"
  | "subcategory";

type SearchResult = {
  id: string;
  kind: ResultKind;
  label: string;
  sublabel?: string;
  badge?: string;
  color?: string;
  emoji?: string | null;
  href: string;
};

type Section = {
  title: string;
  results: SearchResult[];
};

// ─── Static pages ─────────────────────────────────────────────────────────────

const PAGES = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: ["dashboard", "início", "home", "resumo"] },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight, keywords: ["transações", "transacao", "lançamentos", "lancamentos", "gastos", "receitas"] },
  { href: "/accounts", label: "Contas", icon: Wallet, keywords: ["contas", "conta", "banco", "carteira", "cartão", "saldo"] },
  { href: "/investments", label: "Investimentos", icon: TrendingUp, keywords: ["investimentos", "investimento", "ações", "acoes", "ativos", "renda fixa", "fii", "bdr", "etf", "cripto"] },
  { href: "/budgets", label: "Orçamentos", icon: Clock, keywords: ["orçamento", "orcamento", "budget", "meta de gastos"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, keywords: ["analytics", "análise", "analise", "relatórios", "relatorios", "gráficos", "graficos"] },
  { href: "/goals", label: "Metas", icon: Target, keywords: ["metas", "meta", "objetivo", "objetivos", "wishlist"] },
  { href: "/simulations", label: "Simulações", icon: Calculator, keywords: ["simulações", "simulacao", "simulacoes", "projeção", "projecao", "juros compostos"] },
  { href: "/categories", label: "Categorias", icon: Tag, keywords: ["categorias", "categoria", "subcategorias", "subcategoria"] },
  { href: "/profile", label: "Perfil", icon: Settings, keywords: ["perfil", "profile", "preferências", "preferencias", "conta", "senha"] },
];

const ASSET_TYPE_LABELS: Record<string, string> = {
  Acao: "Ação",
  FundoInvestimento: "Fundo",
  FII: "FII",
  Cripto: "Cripto",
  Stock: "Stock",
  Reit: "REIT",
  BDR: "BDR",
  ETF: "ETF",
  ETFInternacional: "ETF Int.",
  TesouroDireto: "Tesouro",
  RendaFixa: "Renda Fixa",
  Moeda: "Moeda",
  Outro: "Outro",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  Checking: "Corrente",
  Savings: "Poupança",
  Credit: "Crédito",
  Cash: "Dinheiro",
};

// ─── Matching ─────────────────────────────────────────────────────────────────

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useGlobalSearch(query: string): Section[] {
  const qc = useQueryClient();

  return useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const sections: Section[] = [];

    // Pages
    const pageResults: SearchResult[] = PAGES.filter((p) =>
      matches(q, p.label, ...p.keywords)
    ).map((p) => ({
      id: `page-${p.href}`,
      kind: "page",
      label: p.label,
      sublabel: p.href,
      href: p.href,
    }));
    if (pageResults.length) sections.push({ title: "Páginas", results: pageResults });

    // Categories & Subcategories (from cache)
    const categories = qc.getQueryData<Category[]>(["categories"]) ?? [];
    const catResults: SearchResult[] = [];
    const subResults: SearchResult[] = [];

    for (const cat of categories) {
      if (matches(q, cat.name)) {
        catResults.push({
          id: `cat-${cat.id}`,
          kind: "category",
          label: cat.name,
          sublabel: `${cat.subCategories.length} subcategoria${cat.subCategories.length !== 1 ? "s" : ""}`,
          color: getCategoryColor(cat.color, cat.name),
          href: "/categories",
        });
      }
      for (const sub of cat.subCategories) {
        if (matches(q, sub.name, cat.name)) {
          subResults.push({
            id: `sub-${sub.id}`,
            kind: "subcategory",
            label: sub.name,
            sublabel: cat.name,
            color: getCategoryColor(cat.color, cat.name),
            emoji: sub.emoji,
            href: "/categories",
          });
        }
      }
    }
    if (catResults.length) sections.push({ title: "Categorias", results: catResults.slice(0, 5) });
    if (subResults.length) sections.push({ title: "Subcategorias", results: subResults.slice(0, 5) });

    // Accounts (from cache)
    const accounts = qc.getQueryData<AccountItem[]>(["accounts"]) ?? [];
    const accountResults: SearchResult[] = accounts
      .filter((a) => matches(q, a.name, ACCOUNT_TYPE_LABELS[a.type]))
      .map((a) => ({
        id: `account-${a.id}`,
        kind: "account",
        label: a.name,
        sublabel: ACCOUNT_TYPE_LABELS[a.type] ?? a.type,
        badge: formatCurrency(a.currentAmount / 100),
        href: "/accounts",
      }));
    if (accountResults.length)
      sections.push({ title: "Contas", results: accountResults.slice(0, 5) });

    // Investments (from portfolio cache)
    const portfolio = qc.getQueryData<InvestmentPortfolio>(["investments"]);
    const investments = portfolio?.investments ?? [];
    const invResults: SearchResult[] = investments
      .filter((i) =>
        matches(q, i.ticker, i.name, ASSET_TYPE_LABELS[i.assetType], i.assetClass, i.broker)
      )
      .map((i) => ({
        id: `inv-${i.id}`,
        kind: "investment",
        label: i.name,
        sublabel: i.ticker,
        badge: ASSET_TYPE_LABELS[i.assetType] ?? i.assetType,
        href: "/investments",
      }));
    if (invResults.length)
      sections.push({ title: "Investimentos", results: invResults.slice(0, 5) });

    // Transactions (from cache — may be empty if user hasn't visited page yet)
    const transactions = qc.getQueryData<TransactionItem[]>(["transactions"]) ?? [];
    const txResults: SearchResult[] = transactions
      .filter((t) => matches(q, t.description, t.subCategoryName, t.accountName))
      .map((t) => ({
        id: `tx-${t.id}`,
        kind: "transaction",
        label: t.description || t.subCategoryName,
        sublabel: t.subCategoryName,
        badge: formatCurrency(t.value / 100),
        href: `/transactions`,
      }));
    if (txResults.length)
      sections.push({ title: "Transações", results: txResults.slice(0, 5) });

    return sections;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, qc]);
}

// ─── Icon per kind ─────────────────────────────────────────────────────────────

function KindIcon({ kind, color, emoji }: { kind: ResultKind; color?: string; emoji?: string | null }) {
  const cls = "shrink-0";
  if (kind === "page") return <ChevronRight size={14} className={cn(cls, "text-text-muted")} />;
  if (kind === "transaction") return <ArrowLeftRight size={14} className={cn(cls, "text-blue")} />;
  if (kind === "investment") return <TrendingUp size={14} className={cn(cls, "text-purple")} />;
  if (kind === "account") return <Wallet size={14} className={cn(cls, "text-green")} />;
  if (kind === "category") {
    return (
      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color ?? "#8A95A3" }}
      />
    );
  }
  if (kind === "subcategory") {
    if (emoji) return <span className="text-[14px] leading-none shrink-0">{emoji}</span>;
    return (
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full opacity-70"
        style={{ backgroundColor: color ?? "#8A95A3" }}
      />
    );
  }
  return <Tag size={14} className={cls} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const onSearchChange = useHeaderStore((s) => s.onSearchChange);
  const searchPlaceholder = useHeaderStore((s) => s.searchPlaceholder);
  const isLocalSearch = !!onSearchChange;

  // Reset query when switching between local and global search modes
  useEffect(() => {
    setQuery("");
    setOpen(false);
  }, [isLocalSearch]);

  const prefetchSearchData = useCallback(() => {
    if (!qc.getQueryData(["accounts"]))
      qc.prefetchQuery({ queryKey: ["accounts"], queryFn: accountsApi.getAll, staleTime: 60_000 });
    if (!qc.getQueryData(["categories"]))
      qc.prefetchQuery({ queryKey: ["categories"], queryFn: categoriesApi.getAll, staleTime: 60_000 });
    if (!qc.getQueryData(["investments"]))
      qc.prefetchQuery({ queryKey: ["investments"], queryFn: investmentsApi.getPortfolio, staleTime: 5 * 60_000 });
    if (!qc.getQueryData(["transactions"]))
      qc.prefetchQuery({ queryKey: ["transactions"], queryFn: transactionsApi.getAll, staleTime: 60_000 });
  }, [qc]);

  const baseSections = useGlobalSearch(isLocalSearch ? "" : query);

  // Market tickers come from the live search API (not the local cache).
  const marketQuery = !isLocalSearch && query.trim().length >= 2 ? query.trim() : "";
  const { data: marketAssets = [] } = useMarketSearch(marketQuery);

  const sections = useMemo(() => {
    if (marketAssets.length === 0) return baseSections;
    const marketResults: SearchResult[] = marketAssets.map((a) => ({
      id: `market-${a.id}`,
      kind: "investment",
      label: a.coinName ?? a.ticker,
      sublabel: a.coinName ? a.ticker : a.name,
      badge: a.assetClass,
      href: `/market/${encodeURIComponent(a.ticker)}`,
    }));
    return [...baseSections, { title: "Mercado", results: marketResults }];
  }, [baseSections, marketAssets]);

  const allResults = sections.flatMap((s) => s.results);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        prefetchSearchData();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [prefetchSearchData]);

  const navigate = useCallback(
    (result: SearchResult) => {
      router.push(result.href);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || allResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = allResults[activeIndex];
      if (result) navigate(result);
    }
  };

  const showDropdown = !isLocalSearch && open && query.trim().length >= 2;

  // Scroll active item into view
  useEffect(() => {
    if (!showDropdown) return;
    const el = dropdownRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showDropdown]);

  return (
    <div className="relative flex-1">
      {/* Input */}
      <div
        className="flex items-center gap-[9px] rounded-full border px-[15px] py-[9px] text-[--text-sub] transition-all"
        style={{
          background: "var(--surface)",
          borderColor: open ? "var(--brand-cobalt)" : "var(--border-color)",
          boxShadow: open ? "0 0 0 3px rgba(31,60,224,0.12)" : undefined,
        }}
      >
        <Search size={14} strokeWidth={1.75} className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (isLocalSearch) {
              onSearchChange!(v);
            } else {
              setOpen(true);
            }
          }}
          onFocus={() => {
            if (!isLocalSearch) {
              prefetchSearchData();
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={isLocalSearch ? (searchPlaceholder ?? "Buscar...") : "Buscar páginas, transações, investimentos..."}
          className="text-[--text] placeholder:text-[--text-sub] flex-1 bg-transparent font-sans text-[13.5px] focus:outline-none"
        />
        <kbd className="hidden rounded border px-1 py-0.5 font-mono text-[10px] text-[--text-sub] sm:inline-flex items-center gap-0.5" style={{ borderColor: "var(--border-color)" }}>
          <span>⌘</span>K
        </kbd>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="border-border bg-surface absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[420px] overflow-y-auto rounded-[10px] border shadow-xl"
        >
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
              <Search size={18} className="text-text-muted mb-1" strokeWidth={1.5} />
              <p className="text-text-sub text-[13px]">Nenhum resultado para "{query}"</p>
              <p className="text-text-muted text-[12px]">Tente outro termo</p>
            </div>
          ) : (
            (() => {
              let globalIdx = 0;
              return sections.map((section) => (
                <div key={section.title}>
                  <div className="border-border bg-surface2/50 border-b border-t px-3 py-1.5 first:border-t-0 first:rounded-t-[10px]">
                    <span className="text-text-muted text-[11px] font-medium uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                  {section.results.map((result) => {
                    const idx = globalIdx++;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={result.id}
                        data-index={idx}
                        onClick={() => navigate(result)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          isActive ? "bg-surface2" : "hover:bg-surface2/60",
                        )}
                      >
                        <KindIcon kind={result.kind} color={result.color} emoji={result.emoji} />

                        <div className="min-w-0 flex-1">
                          <p className="text-text truncate text-[13px] font-medium">{result.label}</p>
                          {result.sublabel && (
                            <p className="text-text-muted truncate text-[11px]">{result.sublabel}</p>
                          )}
                        </div>

                        {result.badge && (
                          <span className="border-border text-text-sub shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px]">
                            {result.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          )}

          {/* Footer */}
          <div className="border-border flex items-center gap-3 border-t px-3 py-2">
            <span className="text-text-muted text-[11px]">
              <kbd className="border-border mr-1 rounded border px-1 font-mono text-[10px]">↑↓</kbd>
              navegar
            </span>
            <span className="text-text-muted text-[11px]">
              <kbd className="border-border mr-1 rounded border px-1 font-mono text-[10px]">↵</kbd>
              selecionar
            </span>
            <span className="text-text-muted text-[11px]">
              <kbd className="border-border mr-1 rounded border px-1 font-mono text-[10px]">Esc</kbd>
              fechar
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
