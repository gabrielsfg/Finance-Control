"use client";

import { cn } from "@/lib/utils";

export type TabChipItem<T extends string = string> = {
  id: T;
  label: string;
};

type TabChipsProps<T extends string = string> = {
  items: readonly TabChipItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "sm" | "md";
};

export function TabChips<T extends string = string>({
  items,
  value,
  onChange,
  className,
  size = "md",
}: TabChipsProps<T>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} role="tablist">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-full border font-medium transition-all outline-none",
              size === "sm"
                ? "h-7 px-3 text-[12px]"
                : "h-8 px-3.5 text-[13px]",
              active
                ? "border-green/45 bg-green/15 text-green"
                : "border-border bg-surface text-text-sub hover:border-border-light hover:text-text",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
