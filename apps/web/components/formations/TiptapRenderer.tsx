"use client";

import { renderRichContent } from "@/lib/sanitize-html";

interface TiptapRendererProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * Rend une description / bio enregistrée (HTML Tiptap OU Markdown) avec un
 * style STRICTEMENT identique à l'éditeur — via la classe partagée `.nk-rich`
 * (globals.css) et le convertisseur unique `renderRichContent`.
 *
 * À utiliser sur TOUTES les pages publiques qui affichent du contenu riche,
 * pour garantir « ce que je vois dans l'éditeur = ce que voient les acheteurs ».
 */
export function TiptapRenderer({ content, className = "" }: TiptapRendererProps) {
  const html = renderRichContent(content);
  if (!html) return null;
  return (
    <div
      className={`nk-rich ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
