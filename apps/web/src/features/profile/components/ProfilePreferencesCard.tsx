"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, ChevronDown, Check } from "lucide-react";
import { usePreferences, useUpdatePreferences } from "@/features/profile/hooks/useProfile";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "BRL", label: "Real Brasileiro", sub: "BRL", countryCode: "br" },
  { code: "USD", label: "Dólar Americano", sub: "USD", countryCode: "us" },
  { code: "EUR", label: "Euro", sub: "EUR", countryCode: "eu" },
  { code: "GBP", label: "Libra Esterlina", sub: "GBP", countryCode: "gb" },
];

const LOCALES = [
  { code: "pt-BR", label: "Português", sub: "Brasil" },
  { code: "en-US", label: "English", sub: "" },
  { code: "es-AR", label: "Español", sub: "" },
];

type CurrencyItem = { code: string; label: string; sub: string; countryCode: string };
type LocaleItem = { code: string; label: string; sub: string };

function FlagImg({ countryCode }: { countryCode: string }) {
  return (
    <img
      src={`https://flagcdn.com/20x15/${countryCode}.png`}
      width={20}
      height={15}
      alt=""
      className="shrink-0 rounded-sm object-cover"
    />
  );
}

function CurrencySelect({
  options,
  value,
  onChange,
}: {
  options: CurrencyItem[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.code === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 h-9 text-[13px] transition-colors min-w-[172px]",
          open
            ? "border-green/60 bg-surface2 text-text"
            : "border-border bg-surface2 text-text hover:border-border/80",
        )}
      >
        <FlagImg countryCode={selected.countryCode} />
        <span className="flex-1 text-left font-medium">{selected.label}</span>
        <span className="text-text-muted text-[11px]">{selected.sub}</span>
        <ChevronDown
          size={13}
          className={cn("text-text-muted ml-0.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 top-full z-50 mt-1.5 min-w-full rounded-xl border shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { onChange(opt.code); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors",
                opt.code === value
                  ? "bg-green/10 text-green"
                  : "text-text hover:bg-surface2",
              )}
            >
              <FlagImg countryCode={opt.countryCode} />
              <span className="flex-1 text-left font-medium">{opt.label}</span>
              <span className={cn("text-[11px]", opt.code === value ? "text-green/70" : "text-text-muted")}>
                {opt.sub}
              </span>
              {opt.code === value && <Check size={12} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocaleSelect({
  options,
  value,
  onChange,
}: {
  options: LocaleItem[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.code === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 h-9 text-[13px] transition-colors min-w-[172px]",
          open
            ? "border-green/60 bg-surface2 text-text"
            : "border-border bg-surface2 text-text hover:border-border/80",
        )}
      >
        <span className="flex-1 text-left font-medium">{selected.label}</span>
        <span className="text-text-muted text-[11px]">{selected.sub}</span>
        <ChevronDown
          size={13}
          className={cn("text-text-muted ml-0.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 top-full z-50 mt-1.5 min-w-full rounded-xl border shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { onChange(opt.code); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors",
                opt.code === value
                  ? "bg-green/10 text-green"
                  : "text-text hover:bg-surface2",
              )}
            >
              <span className="flex-1 text-left font-medium">{opt.label}</span>
              <span className={cn("text-[11px]", opt.code === value ? "text-green/70" : "text-text-muted")}>
                {opt.sub}
              </span>
              {opt.code === value && <Check size={12} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const ProfilePreferencesCard = () => {
  const { data: prefs, isLoading } = usePreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();
  const { theme, setTheme } = useUIStore();

  const [currency, setCurrency] = useState("BRL");
  const [locale, setLocale]     = useState("pt-BR");

  useEffect(() => {
    if (prefs) {
      setCurrency(prefs.currencyCode);
      setLocale(prefs.locale);
    }
  }, [prefs]);

  const isDirty = prefs && (currency !== prefs.currencyCode || locale !== prefs.locale);

  const handleSave = () => {
    if (!isDirty) return;
    updatePreferences({ currencyCode: currency, locale });
  };

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-display font-600 text-text mb-4 text-[15px]">Preferências</p>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface2 h-9 w-full animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {/* Moeda */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Moeda</p>
              <p className="text-text-muted mt-0.5 text-[11px]">Moeda padrão do app</p>
            </div>
            <CurrencySelect options={CURRENCIES} value={currency} onChange={setCurrency} />
          </div>

          {/* Idioma */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Idioma</p>
              <p className="text-text-muted mt-0.5 text-[11px]">Idioma da interface</p>
            </div>
            <LocaleSelect options={LOCALES} value={locale} onChange={setLocale} />
          </div>

          {/* Tema */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Tema</p>
              <p className="text-text-muted mt-0.5 text-[11px]">Aparência do app</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                  theme === "light"
                    ? "border-green/45 bg-green/15 text-green"
                    : "border-border bg-surface2 text-text-sub hover:text-text",
                )}
              >
                <Sun size={13} /> Claro
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                  theme === "dark"
                    ? "border-green/45 bg-green/15 text-green"
                    : "border-border bg-surface2 text-text-sub hover:text-text",
                )}
              >
                <Moon size={13} /> Escuro
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="bg-green hover:bg-green/90 disabled:opacity-50 rounded-lg px-4 py-2 text-[13px] font-medium text-black transition-colors"
          >
            {isPending ? "Salvando..." : "Salvar preferências"}
          </button>
        </div>
      )}
    </div>
  );
};
