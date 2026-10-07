"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Copies `value` to the clipboard and confirms for a moment. */
export function CopyButton({
  value,
  label = "Copiar",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context, permission): the value stays selectable.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copiado" : label}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-[var(--border-color)] px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--surface2)]",
        copied ? "text-[var(--moss)]" : "text-[var(--text-sub)] hover:text-[var(--text)]",
        className,
      )}
    >
      {copied ? <Check size={12} strokeWidth={2.4} /> : <Copy size={12} />}
      {copied ? "Copiado" : label}
    </button>
  );
}

/** A monospace value with a copy button next to it — URLs, commands, tokens. */
export function CopyField({ value, multiline = false }: { value: string; multiline?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-[11px] border border-[var(--border-color)] bg-[var(--surface2)] py-2 pr-2 pl-3">
      <code
        className={cn(
          "min-w-0 flex-1 py-1 font-mono text-[12px] text-[var(--text)] select-all",
          multiline ? "whitespace-pre-wrap break-all" : "truncate",
        )}
      >
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  );
}
