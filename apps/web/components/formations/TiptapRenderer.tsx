"use client";

import { sanitizeRichHtml } from "@/lib/sanitize-html";

interface TiptapRendererProps {
  content: string;
  className?: string;
}

export function TiptapRenderer({ content, className = "" }: TiptapRendererProps) {
  if (!content) return null;
  return (
    <div
      className={`prose prose-slate max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }}
    />
  );
}
