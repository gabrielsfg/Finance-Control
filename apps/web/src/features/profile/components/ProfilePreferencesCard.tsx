"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, ChevronDown, Check } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
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

// `.sel`-styled trigger + tokenised dropdown.
const triggerCls =
  "flex min-w-[180px] items-center gap-2 rounded-[13px] border bg-[var(--surface)] px-3.5 py-2.5 text-[14px] transition-[border-color,box-shadow]";
const menuCls =
  "absolute right-0 top-full z-50 mt-1.5 min-w-full overflow-hidden rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)]";

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
          triggerCls,
          open
            ? "border-[var(--brand-cobalt)] text-[var(--text)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]"
            : "border-[var(--border-color)] text-[var(--text)] hover:border-[var(--brand-cobalt)]/60",
        )}
      >
        <FlagImg countryCode={selected.countryCode} />
        <span className="flex-1 text-left font-medium">{selected.label}</span>
        <span className="font-mono text-[11px] text-[var(--text-sub)]">{selected.sub}</span>
        <ChevronDown
          size={15}
          className={cn("ml-0.5 shrink-0 text-[var(--text-sub)] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className={menuCls} style={{ boxShadow: "var(--shadow-sm)" }}>
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                onChange(opt.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] transition-colors",
                opt.code === value ? "text-[var(--brand-accent)]" : "text-[var(--text)] hover:bg-[var(--surface2)]",
              )}
              style={
                opt.code === value
                  ? { background: "color-mix(in srgb, var(--brand-accent) 12%, transparent)" }
                  : undefined
              }
            >
              <FlagImg countryCode={opt.countryCode} />
              <span className="flex-1 text-left font-medium">{opt.label}</span>
              <span
                className={cn("font-mono text-[11px]", opt.code === value ? "text-[var(--brand-accent)]" : "text-[var(--text-sub)]")}
              >
                {opt.sub}
              </span>
              {opt.code === value && <Check size={13} className="shrink-0" />}
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
          triggerCls,
          open
            ? "border-[var(--brand-cobalt)] text-[var(--text)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]"
            : "border-[var(--border-color)] text-[var(--text)] hover:border-[var(--brand-cobalt)]/60",
        )}
      >
        <span className="flex-1 text-left font-medium">{selected.label}</span>
        <span className="font-mono text-[11px] text-[var(--text-sub)]">{selected.sub}</span>
        <ChevronDown
          size={15}
          className={cn("ml-0.5 shrink-0 text-[var(--text-sub)] transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className={menuCls} style={{ boxShadow: "var(--shadow-sm)" }}>
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                onChange(opt.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[14px] transition-colors",
                opt.code === value ? "text-[var(--brand-accent)]" : "text-[var(--text)] hover:bg-[var(--surface2)]",
              )}
              style={
                opt.code === value
                  ? { background: "color-mix(in srgb, var(--brand-accent) 12%, transparent)" }
                  : undefined
              }
            >
              <span className="flex-1 text-left font-medium">{opt.label}</span>
              <span
                className={cn("font-mono text-[11px]", opt.code === value ? "text-[var(--brand-accent)]" : "text-[var(--text-sub)]")}
              >
                {opt.sub}
              </span>
              {opt.code === value && <Check size={13} className="shrink-0" />}
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
  const [locale, setLocale] = useState("pt-BR");

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
    <Card>
      <CardHead title="Preferências" />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[52px] w-full animate-pulse rounded-[13px] bg-[var(--surface2)]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Tema */}
          <SettingRow name="Tema" desc="Aparência do app">
            <div className="flex gap-1.5">
              <ThemeButton active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun size={13} />}>
                Claro
              </ThemeButton>
              <ThemeButton active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon size={13} />}>
                Escuro
              </ThemeButton>
            </div>
          </SettingRow>

          {/* Moeda */}
          <SettingRow name="Moeda" desc="Moeda padrão do app">
            <CurrencySelect options={CURRENCIES} value={currency} onChange={setCurrency} />
          </SettingRow>

          {/* Idioma */}
          <SettingRow name="Idioma" desc="Idioma da interface" last>
            <LocaleSelect options={LOCALES} value={locale} onChange={setLocale} />
          </SettingRow>
        </div>
      )}

      {!isLoading && (
        <div className="mt-[22px] flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="inline-flex items-center rounded-[13px] px-[18px] py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-50"
            style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
          >
            {isPending ? "Salvando…" : "Salvar preferências"}
          </button>
        </div>
      )}
    </Card>
  );
};

function SettingRow({
  name,
  desc,
  last,
  children,
}: {
  name: string;
  desc: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-3.5 py-[15px]", !last && "border-b border-[var(--border-color)]")}>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[var(--text)]">{name}</div>
        <div className="mt-0.5 text-[13px] text-[var(--text-sub)]">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[13px] border px-3 py-2 text-[13px] font-medium transition-all",
        active
          ? "border-[var(--brand-cobalt)] text-[var(--brand-accent)]"
          : "border-[var(--border-color)] bg-[var(--surface2)] text-[var(--text-sub)] hover:text-[var(--text)]",
      )}
      style={active ? { background: "color-mix(in srgb, var(--brand-accent) 12%, transparent)" } : undefined}
    >
      {icon}
      {children}
    </button>
  );
}
