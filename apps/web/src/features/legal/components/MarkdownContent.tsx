"use client";

import { Fragment, type ReactNode } from "react";

/**
 * Renders the subset of markdown the legal documents actually use: headings,
 * paragraphs, bullet and numbered lists, block quotes, rules, and inline bold,
 * code and links.
 *
 * Deliberately not a markdown library. The need is a handful of block types on a
 * page nobody edits daily, and everything is emitted as React elements — no
 * dangerouslySetInnerHTML anywhere, so the document can never inject markup.
 */

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "rule" };

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+\.\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^-{3,}$/;
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
    if (quote.length) {
      blocks.push({ kind: "quote", text: quote.join(" ") });
      quote = [];
    }
    if (list) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flush();
      continue;
    }

    // A line indented under an open list or paragraph is a wrapped continuation,
    // not a new block — markdown soft-wraps and the source files are hard-wrapped.
    const isContinuation = /^\s{2,}/.test(rawLine);
    if (isContinuation && list?.items.length) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }

    const rule = RULE.exec(line.trim());
    if (rule) {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }

    const quoted = QUOTE.exec(line);
    if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1].trim());
      continue;
    }

    const bullet = BULLET.exec(line.trim());
    const numbered = NUMBERED.exec(line.trim());
    if (bullet || numbered) {
      if (paragraph.length || quote.length) flush();
      const ordered = Boolean(numbered);
      const text = (bullet?.[1] ?? numbered?.[1] ?? "").trim();

      if (!list || list.ordered !== ordered) {
        if (list) blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
        list = { ordered, items: [text] };
      } else {
        list.items.push(text);
      }
      continue;
    }

    if (list || quote.length) flush();
    paragraph.push(line.trim());
  }

  flush();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((piece, index) => {
    if (!piece) return null;

    if (piece.startsWith("**") && piece.endsWith("**")) {
      return (
        <strong key={index} className="font-600 text-text">
          {piece.slice(2, -2)}
        </strong>
      );
    }

    if (piece.startsWith("`") && piece.endsWith("`")) {
      return (
        <code
          key={index}
          className="bg-surface2 text-text-sub rounded-[6px] px-1.5 py-0.5 font-mono text-[12.5px]"
        >
          {piece.slice(1, -1)}
        </code>
      );
    }

    const link = LINK.exec(piece);
    if (link) {
      const [, label, href] = link;
      const isExternal = /^https?:\/\//.test(href);
      return (
        <a
          key={index}
          href={href}
          className="text-green hover:underline"
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }

    return <Fragment key={index}>{piece}</Fragment>;
  });
}

export const MarkdownContent = ({ content }: { content: string }) => {
  const blocks = parse(content);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading": {
            if (block.level === 1) {
              return (
                <h1 key={index} className="font-display font-700 text-text mt-4 text-[26px]">
                  {renderInline(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2 key={index} className="font-display font-700 text-text mt-6 text-[19px]">
                  {renderInline(block.text)}
                </h2>
              );
            }
            return (
              <h3 key={index} className="font-display font-600 text-text mt-4 text-[16px]">
                {renderInline(block.text)}
              </h3>
            );
          }

          case "quote":
            return (
              <blockquote
                key={index}
                className="border-orange/50 bg-orange/5 text-text-sub rounded-r-[9px] border-l-2 py-3 pr-4 pl-4 text-[13.5px] leading-relaxed"
              >
                {renderInline(block.text)}
              </blockquote>
            );

          case "list":
            return block.ordered ? (
              <ol
                key={index}
                className="text-text-sub flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-relaxed"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={index}
                className="text-text-sub flex list-disc flex-col gap-2 pl-5 text-[14px] leading-relaxed"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </ul>
            );

          case "rule":
            return <hr key={index} className="border-border my-2" />;

          default:
            return (
              <p key={index} className="text-text-sub text-[14px] leading-relaxed">
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};
