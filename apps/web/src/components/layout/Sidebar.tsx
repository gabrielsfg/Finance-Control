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
  Clock,
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
  PieChart,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type NavChild = { href: string; label: string; icon?: LucideIcon };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transações",  icon: ArrowLeftRight },
  { href: "/accounts",    label: "Contas",        icon: Wallet },
  { href: "/investments", label: "Investimentos", icon: TrendingUp },
  {
    href: "/market",
    label: "Mercado",
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
      { href: "/simulations",            label: "Juros Compostos",     icon: Percent },
      { href: "/simulations/retirement", label: "Aposentadoria",        icon: PiggyBank },
      { href: "/simulations/historical", label: "Simulação Histórica", icon: History },
      { href: "/simulations/portfolio",  label: "Carteira",            icon: Briefcase },
      { href: "/simulations/goal",       label: "Projeção de Meta",    icon: Goal },
      { href: "/simulations/compare",    label: "Comparar Cenários",   icon: Layers },
    ],
  },
  { href: "/recurring",   label: "Recorrências", icon: RefreshCw },
  { href: "/budgets",     label: "Orçamentos",   icon: Clock },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    children: [
      { href: "/analytics",               label: "Gastos",        icon: PieChart },
      { href: "/analytics/economia",      label: "Economia",      icon: PiggyBank },
      { href: "/analytics/patrimonio",    label: "Patrimônio",    icon: Landmark },
      { href: "/analytics/investimentos", label: "Investimentos", icon: LineChart },
      { href: "/analytics/projecoes",     label: "Projeções",     icon: TrendingUp },
    ],
  },
  { href: "/goals",       label: "Metas",        icon: Target },
  { href: "/categories",  label: "Categorias",   icon: Tag },
  { href: "/profile",     label: "Perfil",       icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();

  // Each group item tracks its own open state; initialised open when already on that route.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    "/market": pathname.startsWith("/market"),
    "/simulations": pathname.startsWith("/simulations"),
    "/analytics": pathname.startsWith("/analytics"),
  }));

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <aside
      className={cn(
        "border-border bg-surface relative flex h-full flex-col border-r transition-all duration-200",
        sidebarCollapsed ? "w-[60px]" : "w-[220px]",
      )}
    >
      {/* Logo */}
      <div className="border-border flex h-14 items-center border-b px-3">
        <div className="from-green to-purple flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br">
          <span className="font-display text-sm font-bold text-black dark:text-white">C</span>
        </div>
        {!sidebarCollapsed && (
          <span className="font-display font-700 text-text ml-3 text-base">
            Controle Financeiro
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isParentActive = item.children
            ? pathname.startsWith(item.href)
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          // ── Group item (has children) ──────────────────────────────────────
          if (item.children) {
            const groupOpen = !!openGroups[item.href];

            // In collapsed mode: clicking the icon navigates to the parent href.
            const collapsedLink = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[9px] px-[10px] py-[9px] transition-all duration-150",
                  isParentActive
                    ? "bg-green/12 text-green"
                    : "text-text-sub hover:bg-surface2 hover:text-text",
                )}
              >
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={collapsedLink} />
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={item.href}>
                {/* Toggle button — does NOT navigate, only opens/closes the submenu */}
                <button
                  onClick={() => toggleGroup(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[9px] px-[10px] py-[9px] transition-all duration-150",
                    isParentActive
                      ? "bg-green/12 text-green"
                      : "text-text-sub hover:bg-surface2 hover:text-text",
                  )}
                >
                  <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                  <span className="font-500 flex-1 text-left font-sans text-[15px]">{item.label}</span>
                  <ChevronDown
                    size={13}
                    className={cn("shrink-0 transition-transform duration-200", groupOpen && "rotate-180")}
                  />
                </button>

                {/* Subitems */}
                {groupOpen && (
                  <div className="border-border/40 ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive =
                        child.href === item.href
                          ? pathname === child.href
                          : pathname === child.href || pathname.startsWith(`${child.href}/`);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 rounded-[7px] px-2 py-[6px] text-[13px] transition-all duration-150",
                            isChildActive
                              ? "text-green font-medium"
                              : "text-text-muted hover:bg-surface2 hover:text-text",
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

          // ── Flat item ──────────────────────────────────────────────────────
          const flatLink = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[9px] px-[10px] py-[9px] transition-all duration-150",
                isParentActive
                  ? "bg-green/12 text-green"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              <Icon size={16} strokeWidth={1.75} className="shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-500 font-sans text-[15px]">{item.label}</span>
              )}
              {isParentActive && !sidebarCollapsed && (
                <span className="bg-green ml-auto h-[5px] w-[5px] rounded-full" />
              )}
            </Link>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={flatLink} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return flatLink;
        })}
      </nav>

      {/* User info */}
      {!sidebarCollapsed && (
        <div className="border-border border-t p-3">
          <div className="flex items-center gap-2">
            <div className="bg-surface2 font-600 text-text flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs">
              GS
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-500 text-text truncate text-[14px]">Gabriel Silva</p>
              <p className="text-text-muted truncate text-[12px]">Premium</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
