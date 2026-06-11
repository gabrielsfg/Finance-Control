"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Repeat,
  CalendarClock,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Target,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NotificationItem,
  NotificationType,
} from "@/lib/types/notifications.types";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../hooks/useNotifications";

// Icon + accent color per notification type.
const TYPE_VISUAL: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  System: { icon: Info, color: "text-text-sub" },
  RecurrenceCharged: { icon: Repeat, color: "text-blue" },
  RecurrenceUpcoming: { icon: CalendarClock, color: "text-blue" },
  CardDueSoon: { icon: CreditCard, color: "text-orange" },
  CardClosingSoon: { icon: CreditCard, color: "text-orange" },
  BudgetThreshold: { icon: PiggyBank, color: "text-yellow" },
  BudgetExceeded: { icon: PiggyBank, color: "text-red" },
  PriceAlert: { icon: TrendingUp, color: "text-purple" },
  GoalReached: { icon: Target, color: "text-green" },
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading } = useNotifications(open);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const unread = countData?.count ?? 0;

  // Close on outside click — same pattern as GlobalSearch.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    if (n.actionUrl) {
      setOpen(false);
      router.push(n.actionUrl);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        title="Notificações"
        aria-label="Notificações"
        className="text-text-sub hover:bg-surface2 hover:text-text relative flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors"
      >
        <Bell size={16} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="bg-red text-[9px] font-bold text-white absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="border-border bg-surface absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[12px] border shadow-xl"
        >
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <span className="text-text text-[14px] font-semibold">Notificações</span>
            {unread > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-text-sub hover:text-text flex items-center gap-1 text-[12px] transition-colors disabled:opacity-50"
              >
                <CheckCheck size={13} />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="text-text-muted py-10 text-center text-[13px]">Carregando…</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
                <Bell size={20} className="text-text-muted mb-1" strokeWidth={1.5} />
                <p className="text-text-sub text-[13px]">Nenhuma notificação</p>
                <p className="text-text-muted text-[12px]">Você está em dia</p>
              </div>
            ) : (
              notifications.map((n) => {
                const visual = TYPE_VISUAL[n.type] ?? TYPE_VISUAL.System;
                const Icon = visual.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "border-border/60 flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0",
                      n.isRead ? "hover:bg-surface2/50" : "bg-surface2/40 hover:bg-surface2/70",
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", visual.color)}>
                      <Icon size={16} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-text truncate text-[13px] font-medium">{n.title}</p>
                        {!n.isRead && <span className="bg-green h-1.5 w-1.5 shrink-0 rounded-full" />}
                      </div>
                      <p className="text-text-sub mt-0.5 text-[12px] leading-snug">{n.body}</p>
                      <p className="text-text-muted mt-1 text-[11px]">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
