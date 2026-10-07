import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The assistant writes a deliberately small subset of markdown: paragraphs separated by a
 * blank line, "- " list items and **bold**. Rendered by hand — a markdown library would
 * be a lot of code for three rules, and it would also render whatever else the model
 * slipped in (links, images, HTML), which is exactly what should not reach the screen.
 */
export function MessageContent({ content, className }: { content: string; className?: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: string }) {
  const lines = block.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let textLines: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="flex list-disc flex-col gap-1 pl-4">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushText = () => {
    if (textLines.length === 0) return;
    nodes.push(
      <p key={`p-${nodes.length}`}>
        {textLines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {renderInline(line)}
          </Fragment>
        ))}
      </p>,
    );
    textLines = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const listMatch = /^\s*[-•]\s+(.*)$/.exec(line);
    if (listMatch) {
      flushText();
      listItems.push(listMatch[1]);
    } else {
      flushList();
      textLines.push(line.trim());
    }
  }
  flushText();
  flushList();

  return <>{nodes}</>;
}

/** `**bold**` only; everything else is plain text (React escapes it). */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-[var(--text)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
