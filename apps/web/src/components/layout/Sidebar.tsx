"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  Calculator,
  BarChart3,
  Target,
  Tag,
  RefreshCw,
  Settings,
  Newspaper,
  CandlestickChart,
  Building2,
  BarChart2,
  Coins,
  DollarSign,
  Globe,
  Landmark,
  ChevronDown,
  Percent,
  PiggyBank,
  History,
  Briefcase,
  Goal,
  Layers,
  LineChart,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import { useAuthStore } from "@/lib/stores/authStore";

type NavChild = { href: string; label: string; icon?: LucideIcon };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Geral",
    items: [
      { href: "/dashboard",    label: "Visão geral",  icon: LayoutDashboard },
      { href: "/accounts",     label: "Contas",        icon: Wallet },
      { href: "/transactions", label: "Transações",   icon: ArrowLeftRight },
      { href: "/recurring",    label: "Recorrências", icon: RefreshCw },
    ],
  },
  {
    label: "Planejar",
    items: [
      { href: "/budgets",     label: "Orçamentos", icon: BarChart3 },
      { href: "/goals",       label: "Metas",      icon: Target },
      { href: "/categories",  label: "Categorias", icon: Tag },
      {
        href: "/analytics",
        label: "Análises",
        icon: LineChart,
        children: [
          { href: "/analytics",                label: "Gastos",        icon: PieChart },
          { href: "/analytics/economia",       label: "Economia",      icon: PiggyBank },
          { href: "/analytics/patrimonio",     label: "Patrimônio",    icon: Landmark },
          { href: "/analytics/investimentos",  label: "Investimentos", icon: TrendingUp },
          { href: "/analytics/projecoes",      label: "Projeções",     icon: TrendingUp },
        ],
      },
    ],
  },
  {
    label: "Mercado",
    items: [
      { href: "/investments", label: "Investimentos", icon: TrendingUp },
      {
        href: "/market",
        label: "Cotações",
        icon: Newspaper,
        children: [
          { href: "/market",                  label: "Geral",   icon: BarChart3 },
          { href: "/market/type/acoes",       label: "Ações",   icon: CandlestickChart },
          { href: "/market/type/fiis",        label: "FIIs",    icon: Building2 },
          { href: "/market/type/etfs",        label: "ETFs",    icon: BarChart2 },
          { href: "/market/type/cripto",      label: "Cripto",  icon: Coins },
          { href: "/market/type/moedas",      label: "Moedas",  icon: DollarSign },
          { href: "/market/type/bdrs",        label: "BDRs",    icon: Globe },
          { href: "/market/type/tesouro",     label: "Tesouro", icon: Landmark },
        ],
      },
      {
        href: "/simulations",
        label: "Simulações",
        icon: Calculator,
        children: [
          { href: "/simulations",             label: "Juros Compostos",  icon: Percent },
          { href: "/simulations/retirement",  label: "Aposentadoria",    icon: PiggyBank },
          { href: "/simulations/historical",  label: "Histórico",        icon: History },
          { href: "/simulations/portfolio",   label: "Carteira",         icon: Briefcase },
          { href: "/simulations/goal",        label: "Projeção de Meta", icon: Goal },
          { href: "/simulations/compare",     label: "Comparar Cenários",icon: Layers },
        ],
      },
    ],
  },
];

/* Glyph — geometric azulejo seal */
function BrandGlyph() {
  return (
    <svg width="38" height="38" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="shrink-0 drop-shadow-[0_6px_14px_rgba(31,60,224,0.28)]">
      <rect width="36" height="36" rx="9" fill="#1F3CE0" />
      <path d="M0 9C0 4 4 0 9 0H18A18 18 0 0 1 0 18Z" fill="#EFEBE1" />
      <path d="M36 27c0 5-4 9-9 9H18A18 18 0 0 1 36 18Z" fill="#EFEBE1" />
      <circle cx="18" cy="18" r="3.4" fill="#2C6B57" />
    </svg>
  );
}

export const Sidebar = () => {
  const pathname = usePathname();
  const { theme } = useUIStore();
  const { user } = useAuthStore();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    "/analytics":   pathname.startsWith("/analytics"),
    "/market":      pathname.startsWith("/market"),
    "/simulations": pathname.startsWith("/simulations"),
  }));

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  function isItemActive(item: NavItem): boolean {
    if (item.children) return pathname.startsWith(item.href);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  const isDark = theme === "dark";

  return (
    <aside className="relative flex h-full w-[252px] shrink-0 flex-col border-r border-[--border-color] bg-gradient-to-b from-[--surface] to-[--surface2]">
      {/* Brand */}
      <div className="flex items-center gap-[11px] px-[18px] pt-[26px] pb-4">
        <BrandGlyph />
        <div>
          <div className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-[--text]">
            Quan<span className="text-[--brand-accent]">tia</span>
          </div>
          <span className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-[--text-sub] mt-[-3px] block">
            controle financeiro
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-[18px] pb-4" style={{ gap: "6px" }}>
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-[2px]">
            {/* Group label */}
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[--text-sub] px-3 py-[6px]">
              {group.label}
            </div>

            {/* Group items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              if (item.children) {
                const open = !!openGroups[item.href];

                return (
                  <div key={item.href}>
                    <button
                      onClick={() => toggleGroup(item.href)}
                      className={cn(
                        "relative flex w-full items-center gap-[11px] rounded-[13px] px-3 py-[9px] text-[14px] font-medium transition-colors duration-150",
                        active
                          ? "bg-[--text] text-[--bg]"
                          : "text-[--text] hover:bg-[--surface2]",
                      )}
                    >
                      {active && (
                        <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1 h-[22px] rounded-r-[4px] bg-[--brand-accent]" />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={1.7}
                        className={cn("shrink-0", active ? "opacity-100" : "opacity-70")}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        size={13}
                        className={cn("shrink-0 opacity-60 transition-transform duration-200", open && "rotate-180")}
                      />
                    </button>

                    {open && (
                      <div className="ml-[22px] mt-[2px] flex flex-col gap-[1px] border-l border-[--border-color] pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive =
                            child.href === item.href
                              ? pathname === child.href
                              : pathname === child.href || pathname.startsWith(`${child.href}/`);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2 rounded-[9px] px-2 py-[6px] text-[13px] transition-colors duration-150",
                                childActive
                                  ? "text-[--brand-accent] font-semibold"
                                  : "text-[--text-sub] hover:bg-[--surface2] hover:text-[--text]",
                              )}
                            >
                              {ChildIcon && (
                                <ChildIcon size={13} strokeWidth={1.75} className="shrink-0" />
                              )}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-[11px] rounded-[13px] px-3 py-[9px] text-[14px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[--text] text-[--bg]"
                      : "text-[--text] hover:bg-[--surface2]",
                  )}
                >
                  {active && (
                    <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1 h-[22px] rounded-r-[4px] bg-[--brand-accent]" />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.7}
                    className={cn("shrink-0", active ? "opacity-100" : "opacity-70")}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-[7px] w-[7px] rounded-full bg-[--clay]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User chip */}
      <div className="px-[18px] pb-5">
        <div className="flex items-center gap-[11px] rounded-[13px] border border-[--border-color] bg-[--surface] p-[10px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[--brand-cobalt] to-[#0c1f9c] font-display text-[15px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-[--text] leading-[1.2] truncate">
              {user?.name ?? "Usuário"}
            </div>
            <div className="font-mono text-[10.5px] text-[--text-sub] truncate">plano pessoal</div>
          </div>
          <Link
            href="/profile"
            className="opacity-55 hover:opacity-100 transition-opacity"
            aria-label="Perfil"
          >
            <Settings size={18} strokeWidth={1.7} className="text-[--text]" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
