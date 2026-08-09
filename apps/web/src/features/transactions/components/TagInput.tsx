"use client";

import { useMemo, useRef, useState } from "react";
import { X, Tag as TagIcon } from "lucide-react";
import { normalizeSearch } from "@/lib/utils";
import { useTags } from "@/features/transactions/hooks/useTags";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
};

type Option =
  | { kind: "tag"; id: number; name: string }
  | { kind: "create"; name: string };

/**
 * Tag picker for the transaction form.
 *
 * Two tags that differ only by case or accent are the same tag — "Férias" and "ferias"
 * splitting in two is exactly what makes tagging useless six months later. So matching,
 * duplicate detection and the "create" offer all run on {@link normalizeSearch}, and
 * picking an existing tag always commits **its** spelling, never what was typed. The
 * server applies the same rule when it saves, so a stale suggestion list cannot fork a
 * tag either.
 */
export function TagInput({ value, onChange }: Props) {
  const { data: existingTags = [] } = useTags();
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = input.trim();

  const options = useMemo<Option[]>(() => {
    const queryKey = normalizeSearch(query);
    const selectedKeys = new Set(value.map(normalizeSearch));

    const available = existingTags
      .filter((tag) => !selectedKeys.has(normalizeSearch(tag.name)))
      .map((tag) => ({ tag, key: normalizeSearch(tag.name) }));

    // No text yet: the whole list, which is the point — the user should not have to
    // remember what they called it.
    const matches = queryKey
      ? available
          .filter(({ key }) => key.includes(queryKey))
          // Whoever starts with what was typed is what the user meant.
          .sort((a, b) => Number(b.key.startsWith(queryKey)) - Number(a.key.startsWith(queryKey)))
      : available;

    const result: Option[] = matches.map(({ tag }) => ({
      kind: "tag",
      id: tag.id,
      name: tag.name,
    }));

    const alreadyExists = existingTags.some((tag) => normalizeSearch(tag.name) === queryKey);
    if (queryKey && !alreadyExists) result.push({ kind: "create", name: query });

    return result;
  }, [existingTags, value, query]);

  function addTag(name: string) {
    const trimmed = name.trim();
    const key = normalizeSearch(trimmed);
    if (!key) return;

    // Already on this transaction, however it was spelled.
    if (value.some((tag) => normalizeSearch(tag) === key)) {
      setInput("");
      return;
    }

    // An existing tag keeps its own spelling; only a genuinely new name is taken verbatim.
    const canonical = existingTags.find((tag) => normalizeSearch(tag.name) === key)?.name ?? trimmed;

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
        className="border-border bg-surface2 flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-[13px] border px-3 py-2 focus-within:border-[var(--brand-cobalt)]"
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon size={13} className="text-text-muted shrink-0" />
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-green/10 text-green flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              title={`Remover tag "${tag}"`}
              className="hover:text-red transition-colors"
            >
              <X size={10} />
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
          placeholder={value.length === 0 ? "Adicionar tags..." : ""}
          className="text-text placeholder:text-text-muted min-w-[100px] flex-1 bg-transparent text-[13px] outline-none"
        />
      </div>

      {showDropdown && options.length > 0 && (
        <div
          className="border-border bg-surface absolute z-50 mt-1 w-full overflow-y-auto rounded-[13px] border shadow-lg"
          style={{ maxHeight: 240 }}
        >
          {options.map((option, index) => {
            const isHighlighted = index === highlight;

            return (
              <button
                key={option.kind === "tag" ? `tag-${option.id}` : "create"}
                type="button"
                onMouseDown={() => addTag(option.name)}
                onMouseEnter={() => setHighlight(index)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors ${
                  isHighlighted ? "bg-surface2" : ""
                }`}
              >
                {option.kind === "tag" ? (
                  <>
                    <TagIcon size={11} className="text-text-muted shrink-0" />
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
