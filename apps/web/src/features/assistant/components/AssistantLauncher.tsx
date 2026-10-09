"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAssistantStore } from "@/lib/stores/assistantStore";
import { AssistantDrawer } from "./AssistantDrawer";

/**
 * The chat entry point: a floating button on every authenticated screen, and the drawer
 * it opens. Mounted once by the app shell, so the conversation survives navigation.
 * Free accounts get the same button — the drawer opens on the Premium notice instead.
 */
export function AssistantLauncher() {
  const isOpen = useAssistantStore((s) => s.isOpen);
  const open = useAssistantStore((s) => s.open);
  const close = useAssistantStore((s) => s.close);
  const pathname = usePathname();

  // The drawer covers the page, so a route change can only come from a link inside it
  // ("Perfil → IA no Quantia", say) — get out of the way of the page it opened.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={open}
          aria-label="Abrir assistente de IA"
          title="Assistente de IA"
          className="anim-fade fixed right-6 bottom-6 z-30 flex h-12 items-center gap-2 rounded-full pr-5 pl-4 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[2px]"
          style={{
            background: "var(--brand-cobalt)",
            boxShadow: "0 14px 28px -12px rgba(31,60,224,0.75)",
          }}
        >
          <Sparkles size={17} strokeWidth={2} />
          <span className="hidden sm:inline">Assistente</span>
        </button>
      )}
      <AssistantDrawer />
    </>
  );
}
