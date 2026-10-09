"use client";

import Link from "next/link";
import { CalendarClock, CircleSlash, Gauge, PowerOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AiAvailability } from "@/lib/types/insight.types";

/** Where "Você desligou a IA" sends people — the card that holds the switch. */
export const AI_SETTINGS_HREF = "/profile#ai-settings";

type NoticeStatus = Exclude<AiAvailability, "Available" | "NotPremium">;

const NOTICES: Record<NoticeStatus, { icon: LucideIcon; color: string; title: string; body: string }> = {
  AiDisabled: {
    icon: PowerOff,
    color: "var(--text-sub)",
    title: "Você desligou a IA",
    body: "Nada é enviado para análise enquanto ela estiver desligada. Dá para religar quando quiser.",
  },
  Unavailable: {
    icon: CircleSlash,
    color: "var(--text-sub)",
    title: "Indisponível no momento",
    body: "Os recursos de IA estão pausados. Tente de novo mais tarde.",
  },
  QuotaExceeded: {
    icon: Gauge,
    color: "var(--gold)",
    title: "Limite do mês atingido",
    body: "Você já usou todas as análises de IA deste mês. O limite renova no começo do próximo.",
  },
  NotEnoughData: {
    icon: CalendarClock,
    color: "var(--text-sub)",
    title: "Ainda não há dados suficientes",
    body: "Ainda não há dados suficientes para a análise desta semana. Continue lançando e ela aparece por aqui.",
  },
};

/**
 * The quiet body an AI card shows when there is no content to show — every state the
 * API can answer except Available (content) and NotPremium (the upsell, which each
 * card renders with its own copy).
 */
export function AiStatusNotice({
  status,
  compact = false,
}: {
  status: NoticeStatus;
  /** One line only, for when the card still shows content above it (QuotaExceeded). */
  compact?: boolean;
}) {
  const notice = NOTICES[status];
  const Icon = notice.icon;

  if (compact) {
    return (
      <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-sub)]">
        <Icon size={12} style={{ color: notice.color }} className="shrink-0" />
        {notice.title}
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div
        className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
        style={{ background: `color-mix(in srgb, ${notice.color} 16%, transparent)` }}
      >
        <Icon size={12} style={{ color: notice.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-[var(--text)]">{notice.title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--text-sub)]">{notice.body}</p>
        {status === "AiDisabled" && (
          <Link
            href={AI_SETTINGS_HREF}
            className="mt-2 inline-block font-mono text-[11px] tracking-[0.1em] text-[var(--brand-accent)] uppercase hover:underline"
          >
            Perfil → IA no Quantia
          </Link>
        )}
      </div>
    </div>
  );
}
