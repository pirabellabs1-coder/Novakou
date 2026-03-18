"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface TiptapRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders Tiptap HTML content safely with DOMPurify sanitization.
 * Falls back to wrapping plain text in paragraphs if content is not HTML.
 */
export function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const sanitizedHtml = useMemo(() => {
    if (!content) return "";

    // Detect if content is HTML (starts with a tag or contains common HTML elements)
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    const html = isHtml
      ? content
      : content
          .split("\n\n")
          .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");

    if (typeof window === "undefined") return html;

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s", "a", "h1", "h2", "h3",
        "ul", "ol", "li", "blockquote", "pre", "code", "img", "hr",
        "table", "thead", "tbody", "tr", "th", "td",
        "span", "mark", "div", "figure", "figcaption",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "width", "height",
        "class", "style", "colspan", "rowspan",
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
  }, [content]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none
        [&_table]:border-collapse [&_table]:w-full [&_table]:my-4
        [&_th]:border [&_th]:border-slate-300 [&_th]:dark:border-slate-600 [&_th]:bg-slate-100 dark:bg-slate-800 [&_th]:dark:bg-slate-800 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sm
        [&_td]:border [&_td]:border-slate-200 dark:border-slate-700 [&_td]:dark:border-slate-700 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm
        [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-500/30 [&_mark]:px-1 [&_mark]:rounded
        [&_img]:rounded-lg [&_img]:max-w-full
        ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
