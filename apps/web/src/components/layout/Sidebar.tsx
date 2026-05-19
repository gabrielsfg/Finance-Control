"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/investments", label: "Investimentos", icon: TrendingUp },
  { href: "/simulations", label: "Simulações", icon: Calculator },
  { href: "/recurring", label: "Recorrências", icon: RefreshCw },
  { href: "/budgets", label: "Orçamentos", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/categories", label: "Categorias", icon: Tag },
  { href: "/profile", label: "Perfil", icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();

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
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          const item = (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[9px] px-[10px] py-[9px] transition-all duration-150",
                isActive
                  ? "bg-green/12 text-green"
                  : "text-text-sub hover:bg-surface2 hover:text-text",
              )}
            >
              <Icon size={16} strokeWidth={1.75} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-500 font-sans text-[15px]">{label}</span>}
              {isActive && !sidebarCollapsed && (
                <span className="bg-green ml-auto h-[5px] w-[5px] rounded-full" />
              )}
            </Link>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger render={item} />
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }

          return item;
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
