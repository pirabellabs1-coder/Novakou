/**
 * Minimal safe Markdown renderer — aucune dépendance externe.
 * Gère : h2, h3, h4, listes (•, 1.), paragraphes, liens, gras, italique,
 * code inline, blockquotes, tableaux, séparateurs.
 *
 * Volontairement simple : pas de HTML user arbitraire, pas de XSS possible.
 */

import Link from "next/link";
import React from "react";

// Inline formatters : **bold**, *italic*, `code`, [text](url)
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let buf = "";

  function flush() {
    if (buf) {
      nodes.push(buf);
      buf = "";
    }
  }

  while (i < text.length) {
    // Link [text](url)
    if (text[i] === "[") {
      const closeBracket = text.indexOf("]", i);
      const openParen = closeBracket >= 0 ? text[closeBracket + 1] : undefined;
      if (closeBracket > 0 && openParen === "(") {
        const closeParen = text.indexOf(")", closeBracket);
        if (closeParen > closeBracket) {
          const label = text.slice(i + 1, closeBracket);
          const url = text.slice(closeBracket + 2, closeParen);
          flush();
          const isExternal = /^https?:\/\//.test(url);
          const isInternal = url.startsWith("/");
          if (isInternal) {
            nodes.push(
              <Link key={nodes.length} href={url} className="text-emerald-700 hover:text-emerald-900 underline font-semibold">
                {renderInline(label)}
              </Link>,
            );
          } else if (isExternal) {
            nodes.push(
              <a key={nodes.length} href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 underline font-semibold">
                {renderInline(label)}
              </a>,
            );
          } else {
            nodes.push(label);
          }
          i = closeParen + 1;
          continue;
        }
      }
    }

    // Bold **text**
    if (text[i] === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end > i + 1) {
        flush();
        nodes.push(<strong key={nodes.length} className="font-extrabold text-slate-900">{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }

    // Italic *text*
    if (text[i] === "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i) {
        flush();
        nodes.push(<em key={nodes.length} className="italic">{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }

    // Code `text`
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i) {
        flush();
        nodes.push(
          <code key={nodes.length} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-emerald-800 text-[0.9em] font-mono">
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }

    buf += text[i];
    i++;
  }
  flush();
  return nodes;
}

function renderTable(lines: string[]): React.ReactNode {
  const [headerLine, , ...bodyLines] = lines;
  if (!headerLine) return null;
  const headers = headerLine.split("|").slice(1, -1).map((h) => h.trim());
  const rows = bodyLines.map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
  return (
    <div className="overflow-x-auto my-5 rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold text-slate-900 border-b border-slate-200">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-700">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function renderMarkdown(src: string): React.ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines at start
    if (!line.trim()) {
      i++;
      continue;
    }

    // Table (starts with `|`)
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      out.push(<React.Fragment key={out.length}>{renderTable(tableLines)}</React.Fragment>);
      continue;
    }

    // Blockquote >
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      out.push(
        <blockquote
          key={out.length}
          className="my-4 border-l-4 border-emerald-500 bg-emerald-50/50 pl-4 py-2 pr-3 text-sm text-slate-700"
        >
          {renderInline(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      out.push(
        <h3 key={out.length} className="text-lg font-extrabold text-slate-900 mt-6 mb-2">
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(
        <h2 key={out.length} className="text-xl md:text-2xl font-extrabold text-slate-900 mt-8 mb-3 tracking-tight">
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      out.push(
        <h4 key={out.length} className="text-base font-bold text-slate-800 mt-4 mb-2">
          {renderInline(line.slice(5))}
        </h4>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trim())) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().slice(2))}</li>);
        i++;
      }
      out.push(
        <ul key={out.length} className="list-disc pl-5 my-3 space-y-1.5 text-sm text-slate-700 leading-relaxed">
          {items}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().replace(/^\d+\.\s/, ""))}</li>);
        i++;
      }
      out.push(
        <ol key={out.length} className="list-decimal pl-5 my-3 space-y-1.5 text-sm text-slate-700 leading-relaxed">
          {items}
        </ol>,
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      out.push(<hr key={out.length} className="my-6 border-slate-200" />);
      i++;
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !lines[i].startsWith("> ") &&
      !lines[i].trim().startsWith("|") &&
      lines[i].trim() !== "---"
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    out.push(
      <p key={out.length} className="my-3 text-sm text-slate-700 leading-relaxed">
        {renderInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return out;
}
