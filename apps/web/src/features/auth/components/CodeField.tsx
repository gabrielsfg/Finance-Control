"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The 6-digit input shared by every emailed-code screen.
 *
 * `autoComplete="one-time-code"` is what lets iOS and Android offer the code straight
 * from the SMS/email notification, and `inputMode="numeric"` brings up the digit pad
 * instead of the full keyboard. Both only work on a real `<input>`, which is why this
 * is one wide field rather than six boxes.
 */
export const CodeField = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  function CodeField({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        className={cn(
          "bg-surface2 text-text placeholder:text-text-muted/40 w-full rounded-[9px] border px-[14px] py-[13px]",
          "text-center font-mono text-[26px] tracking-[0.4em] focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
