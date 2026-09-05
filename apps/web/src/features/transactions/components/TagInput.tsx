"use client";

import { useMemo, useRef, useState } from "react";
import { X, Tag as TagIcon } from "lucide-react";
import { normalizeSearch } from "@/lib/utils";
import { useTags } from "@/features/transactions/hooks/useTags";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  /**
   * "md" is the form field. "sm" is the same control shrunk to a table cell — used by the
   * import review, where every row gets one. Only metrics change: matching, creation and
   * keyboard handling are shared, so the two can never disagree about what a tag is.
   */
  size?: "md" | "sm";
  /**
   * Names to offer alongside the saved tags: tags that exist only in the caller's own
   * unsaved batch. The import review passes every tag typed on any row, so inventing
   * "Viagem" on row 1 makes it a suggestion on row 40 instead of something to retype
   * from memory. They also take part in canonicalisation, so a batch cannot fork a
   * spelling on its way to the server.
   *
   * Must be a stable reference (memoised by the caller) — it feeds a memo.
   */
  extraOptions?: string[];
};

const NO_EXTRA_OPTIONS: string[] = [];

const SIZES = {
  md: {
    box: "min-h-11 gap-1.5 rounded-[13px] px-3 py-2",
    icon: 13,
    chip: "gap-1 rounded-md px-2 py-0.5 text-[12px]",
    chipClose: 10,
    input: "min-w-[100px] text-[13px]",
    placeholder: "Adicionar tags...",
    menu: "rounded-[13px]",
    option: "gap-2 px-3 py-2.5 text-[13px]",
    optionIcon: 11,
    menuMaxHeight: 240,
  },
  sm: {
    box: "min-h-7 gap-1 rounded-md px-2 py-1",
    icon: 11,
    chip: "gap-0.5 rounded px-1.5 text-[11px]",
    chipClose: 9,
    input: "min-w-[54px] text-[12px]",
    placeholder: "Tags...",
    menu: "rounded-lg",
    option: "gap-1.5 px-2.5 py-1.5 text-[12px]",
    optionIcon: 10,
    menuMaxHeight: 200,
  },
} as const;

type Option =
  | { kind: "tag"; name: string }
  | { kind: "create"; name: string };

/**
 * Tag picker for the transaction form and the import review.
 *
 * Two tags that differ only by case or accent are the same tag — "Férias" and "ferias"
 * splitting in two is exactly what makes tagging useless six months later. So matching,
 * duplicate detection and the "create" offer all run on {@link normalizeSearch}, and
 * picking a known tag always commits **its** spelling, never what was typed. The server
 * applies the same rule when it saves, so a stale suggestion list cannot fork a tag
 * either.
 */
export function TagInput({
  value,
  onChange,
  size = "md",
  extraOptions = NO_EXTRA_OPTIONS,
}: Props) {
  const metrics = SIZES[size];
  const { data: savedTags = [] } = useTags();
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = input.trim();

  /**
   * Every name this picker knows, deduplicated by comparison key. Saved tags come first
   * so their spelling wins: the row that already exists in the database is the canonical
   * one, and a batch that typed "viagem" should still commit to "Viagem".
   */
  const pool = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const name of [...savedTags.map((tag) => tag.name), ...extraOptions]) {
      const key = normalizeSearch(name);
      if (key && !byKey.has(key)) byKey.set(key, name);
    }
    return [...byKey.values()];
  }, [savedTags, extraOptions]);

  const options = useMemo<Option[]>(() => {
    const queryKey = normalizeSearch(query);
    const selectedKeys = new Set(value.map(normalizeSearch));

    const available = pool
      .map((name) => ({ name, key: normalizeSearch(name) }))
      .filter(({ key }) => !selectedKeys.has(key));

    // No text yet: the whole list, which is the point — the user should not have to
    // remember what they called it.
    const matches = queryKey
      ? available
          .filter(({ key }) => key.includes(queryKey))
          // Whoever starts with what was typed is what the user meant.
          .sort((a, b) => Number(b.key.startsWith(queryKey)) - Number(a.key.startsWith(queryKey)))
      : available;

    const result: Option[] = matches.map(({ name }) => ({ kind: "tag", name }));

    const alreadyKnown = pool.some((name) => normalizeSearch(name) === queryKey);
    if (queryKey && !alreadyKnown) result.push({ kind: "create", name: query });

    return result;
  }, [pool, value, query]);

  function addTag(name: string) {
    const trimmed = name.trim();
    const key = normalizeSearch(trimmed);
    if (!key) return;

    // Already on this transaction, however it was spelled.
    if (value.some((tag) => normalizeSearch(tag) === key)) {
      setInput("");
      return;
    }

    // A known name keeps its own spelling; only a genuinely new one is taken verbatim.
    const canonical = pool.find((name) => normalizeSearch(name) === key) ?? trimmed;

    onChange([...value, canonical]);
    setInput("");
    setHighlight(0);
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (options.length === 0) return;
      event.preventDefault();
      setShowDropdown(true);
      setHighlight((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        return (next + options.length) % options.length;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      // Enter takes the highlighted option before it takes the raw text — typing "via"
      // and pressing Enter must attach "Viagem", not create a tag called "via".
      const option = showDropdown ? options[highlight] : undefined;
      if (option) {
        addTag(option.name);
        return;
      }

      if (query) addTag(query);
      return;
    }

    if (event.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
      return;
    }

    if (event.key === "Escape") setShowDropdown(false);
  }

  return (
    <div className="relative">
      <div
        className={`border-border bg-surface2 flex cursor-text flex-wrap items-center border focus-within:border-[var(--brand-cobalt)] ${metrics.box}`}
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon size={metrics.icon} className="text-text-muted shrink-0" />
        {value.map((tag) => (
          <span
            key={tag}
            className={`bg-green/10 text-green flex items-center font-medium ${metrics.chip}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              title={`Remover tag "${tag}"`}
              className="hover:text-red transition-colors"
            >
              <X size={metrics.chipClose} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHighlight(0);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? metrics.placeholder : ""}
          className={`text-text placeholder:text-text-muted flex-1 bg-transparent outline-none ${metrics.input}`}
        />
      </div>

      {showDropdown && options.length > 0 && (
        <div
          className={`border-border bg-surface absolute z-50 mt-1 w-full min-w-[180px] overflow-y-auto border shadow-lg ${metrics.menu}`}
          style={{ maxHeight: metrics.menuMaxHeight }}
        >
          {options.map((option, index) => {
            const isHighlighted = index === highlight;

            return (
              <button
                key={option.kind === "tag" ? `tag-${option.name}` : "create"}
                type="button"
                onMouseDown={() => addTag(option.name)}
                onMouseEnter={() => setHighlight(index)}
                className={`flex w-full items-center text-left transition-colors ${metrics.option} ${
                  isHighlighted ? "bg-surface2" : ""
                }`}
              >
                {option.kind === "tag" ? (
                  <>
                    <TagIcon size={metrics.optionIcon} className="text-text-muted shrink-0" />
                    <span className="text-text">{option.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-green font-medium">+ Criar</span>
                    <span className="text-text">&quot;{option.name}&quot;</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
