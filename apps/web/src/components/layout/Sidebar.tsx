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
  ChevronsLeft,
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

/**
 * Labels stay mounted and squeeze to nothing as the rail narrows, so they
 * travel with the sidebar width instead of vanishing on the first frame.
 */
function NavLabel({
  collapsed,
  children,
  className,
}: {
  collapsed: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out",
        collapsed ? "pointer-events-none max-w-0 opacity-0" : "max-w-[170px] opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const { user } = useAuthStore();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    "/analytics":   pathname.startsWith("/analytics"),
    "/market":      pathname.startsWith("/market"),
    "/simulations": pathname.startsWith("/simulations"),
  }));

  function toggleGroup(href: string) {
    // On the collapsed rail there is no room for a submenu — expand the sidebar
    // and open the group in one gesture.
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [href]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  function isItemActive(item: NavItem): boolean {
    if (item.children) return pathname.startsWith(item.href);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "U";

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-[var(--border-color)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface2)]",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-[76px]" : "w-[252px]",
      )}
    >
      {/* Collapse toggle — a squared handle straddling the rail edge, vertically
          centred on the brand glyph so it reads as part of the header chrome.
          Squared radius (not a circle) to stay inside the Quantia radius scale;
          one icon that rotates, so the control animates with the rail. */}
      <button
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        className={cn(
          "absolute -right-[15px] top-[30px] z-20 flex h-[30px] w-[30px] items-center justify-center rounded-[10px]",
          "border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-sub)]",
          "shadow-[var(--shadow-sm)] transition-colors duration-200",
          "hover:border-[var(--brand-cobalt)] hover:bg-[var(--surface2)] hover:text-[var(--brand-cobalt)]",
        )}
      >
        <ChevronsLeft
          size={15}
          strokeWidth={2}
          className={cn("transition-transform duration-300 ease-out", collapsed && "rotate-180")}
        />
      </button>

      {/* Brand */}
      <div className={cn("flex items-center gap-[11px] pt-[26px] pb-4", collapsed ? "justify-center px-0" : "px-[18px]")}>
        <BrandGlyph />
        {!collapsed && (
          <div className="anim-fade">
            <div className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--text)]">
              Quan<span className="text-[var(--brand-accent)]">tia</span>
            </div>
            <span className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-[var(--text-sub)] mt-[-3px] block">
              controle financeiro
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn("flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-4", collapsed ? "px-[14px]" : "px-[18px]")}
        style={{ gap: "6px" }}
      >
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-[2px]">
            {/* Group label — becomes a hairline divider on the collapsed rail */}
            {collapsed ? (
              <div className="mx-auto my-[7px] h-px w-6 bg-[var(--border-color)]" aria-hidden="true" />
            ) : (
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--text-sub)] px-3 py-[6px]">
                {group.label}
              </div>
            )}

            {/* Group items */}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              if (item.children) {
                const open = !collapsed && !!openGroups[item.href];

                return (
                  <div key={item.href}>
                    <button
                      onClick={() => toggleGroup(item.href)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex w-full items-center rounded-[13px] py-[9px] text-[14px] font-medium transition-[background-color,color,gap,padding] duration-300",
                        collapsed ? "justify-center gap-0 px-0" : "gap-[11px] px-3",
                        active
                          ? "bg-[var(--text)] text-[var(--bg)]"
                          : "text-[var(--text)] hover:bg-[var(--surface2)]",
                      )}
                    >
                      {active && (
                        <span
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-1 h-[22px] rounded-r-[4px] bg-[var(--brand-accent)]",
                            collapsed ? "-left-[14px]" : "-left-[18px]",
                          )}
                        />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={1.7}
                        className={cn("shrink-0", active ? "opacity-100" : "opacity-70")}
                      />
                      <NavLabel collapsed={collapsed} className={collapsed ? undefined : "flex-1 text-left"}>
                        {item.label}
                      </NavLabel>
                      <ChevronDown
                        size={13}
                        className={cn(
                          "shrink-0 opacity-60 transition-[transform,width,opacity] duration-300",
                          collapsed && "w-0 opacity-0",
                          open && "rotate-180",
                        )}
                      />
                    </button>

                    {/* Submenu — grid-rows trick so the height animates both ways. */}
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-[250ms] ease-out"
                      style={{
                        gridTemplateRows: open ? "1fr" : "0fr",
                        opacity: open ? 1 : 0,
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-[22px] mt-[2px] flex flex-col gap-[1px] border-l border-[var(--border-color)] pl-3">
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
                                tabIndex={open ? undefined : -1}
                                className={cn(
                                  "flex items-center gap-2 rounded-[9px] px-2 py-[6px] text-[13px] transition-colors duration-150",
                                  childActive
                                    ? "text-[var(--brand-accent)] font-semibold"
                                    : "text-[var(--text-sub)] hover:bg-[var(--surface2)] hover:text-[var(--text)]",
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
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center rounded-[13px] py-[9px] text-[14px] font-medium transition-[background-color,color,gap,padding] duration-300",
                    collapsed ? "justify-center gap-0 px-0" : "gap-[11px] px-3",
                    active
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "text-[var(--text)] hover:bg-[var(--surface2)]",
                  )}
                >
                  {active && (
                    <span
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-1 h-[22px] rounded-r-[4px] bg-[var(--brand-accent)]",
                        collapsed ? "-left-[14px]" : "-left-[18px]",
                      )}
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.7}
                    className={cn("shrink-0", active ? "opacity-100" : "opacity-70")}
                  />
                  <NavLabel collapsed={collapsed}>{item.label}</NavLabel>
                  {active && !collapsed && (
                    <span className="anim-fade ml-auto h-[7px] w-[7px] rounded-full bg-[var(--clay)]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User chip */}
      <div className={cn("pb-5", collapsed ? "px-[14px]" : "px-[18px]")}>
        <div
          className={cn(
            "flex items-center gap-[11px] rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] p-[10px] transition-all duration-300",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <Link
              href="/profile"
              title={user?.name ?? "Perfil"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--brand-cobalt)] to-[#0c1f9c] font-display text-[15px] font-bold text-white transition-transform duration-200 hover:scale-105"
            >
              {initials}
            </Link>
          ) : (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--brand-cobalt)] to-[#0c1f9c] font-display text-[15px] font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1 anim-fade">
                <div className="text-[13.5px] font-semibold text-[var(--text)] leading-[1.2] truncate">
                  {user?.name ?? "Usuário"}
                </div>
                <div className="font-mono text-[10.5px] text-[var(--text-sub)] truncate">plano pessoal</div>
              </div>
              <Link
                href="/profile"
                className="opacity-55 hover:opacity-100 transition-opacity"
                aria-label="Perfil"
              >
                <Settings size={18} strokeWidth={1.7} className="text-[var(--text)]" />
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
