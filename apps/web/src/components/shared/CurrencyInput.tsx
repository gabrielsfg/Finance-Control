"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
};

const MAX_CENTS = 999_999_999;

function toCents(s: string): number {
  if (!s) return 0;
  return Math.min(Math.round(parseFloat(s) * 100), MAX_CENTS);
}

function formatDisplay(cents: number): string {
  const [intPart, decPart] = (cents / 100).toFixed(2).split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intFormatted},${decPart}`;
}

export function CurrencyInput({ value, onChange, className, disabled }: Props) {
  const [cents, setCents] = useState(() => toCents(value));
  const externalRef = useRef(value);

  useEffect(() => {
    if (value !== externalRef.current) {
      externalRef.current = value;
      setCents(toCents(value));
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const newCents = Math.min(cents * 10 + parseInt(e.key, 10), MAX_CENTS);
      setCents(newCents);
      externalRef.current = newCents > 0 ? (newCents / 100).toFixed(2) : "";
      onChange(externalRef.current);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const newCents = Math.floor(cents / 10);
      setCents(newCents);
      externalRef.current = newCents > 0 ? (newCents / 100).toFixed(2) : "";
      onChange(externalRef.current);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatDisplay(cents)}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
      className={className}
      disabled={disabled}
    />
  );
}
