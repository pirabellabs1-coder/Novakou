"use client";

/**
 * DraggableVariableBadge — Badge de variable dynamique draggable.
 *
 * Usage :
 *   <DraggableVariableBadge
 *     token="{{customer.firstName}}"
 *     label="Nom du client"
 *     onInsert={() => insertToField(token)}
 *   />
 *
 * Comportement :
 *   - Clic → appelle onInsert (insertion à la position du curseur, fallback = fin du champ)
 *   - Glisser-déposer → le navigateur insère nativement le token au point de drop
 *     dans un input/textarea/contenteditable (RichTextEditor)
 *   - Cursor "grab" pour signaler le drag
 */

import { useState } from "react";

interface Props {
  token: string;
  label: string;
  description?: string;
  icon?: string;
  onInsert?: (token: string) => void;
  className?: string;
  variant?: "default" | "compact";
}

export default function DraggableVariableBadge({
  token,
  label,
  description,
  icon = "drag_indicator",
  onInsert,
  className = "",
  variant = "default",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(e: React.DragEvent<HTMLButtonElement>) {
    // Texte brut déposé dans inputs / textarea / contenteditable
    e.dataTransfer.setData("text/plain", token);
    // Format custom aussi pour détection contextuelle
    e.dataTransfer.setData("application/x-fh-variable", token);
    e.dataTransfer.effectAllowed = "copy";
    setIsDragging(true);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  function handleClick() {
    if (onInsert) onInsert(token);
  }

  const base =
    "inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all cursor-grab active:cursor-grabbing select-none";
  const sizes =
    variant === "compact"
      ? "px-2 py-1 text-[10px]"
      : "px-3 py-1.5 text-xs";
  const colors = isDragging
    ? "bg-[#006e2f] text-white border-[#006e2f] shadow-md scale-105"
    : "bg-white text-[#191c1e] border-gray-200 hover:border-[#006e2f] hover:bg-[#006e2f]/5 hover:text-[#006e2f]";

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      title={description ? `${description} — Glissez-déposez ou cliquez pour insérer` : "Glissez-déposez ou cliquez pour insérer"}
      className={`${base} ${sizes} ${colors} ${className}`}
      aria-label={`Insérer la variable ${label}`}
    >
      <span className="material-symbols-outlined text-[13px] opacity-60">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * Helper pour brancher le drop sur n'importe quel input/textarea contrôlé par React.
 * À utiliser avec onDrop sur l'input.
 *
 * ex :
 *   <input
 *     value={val}
 *     onChange={...}
 *     onDrop={onDropInsertVariable((token, cursorPos) => setVal(...))}
 *     onDragOver={(e) => e.preventDefault()}
 *   />
 */
export function onDropInsertVariable(
  setValue: (next: string, cursorPos: number) => void,
) {
  return (e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const token =
      e.dataTransfer.getData("application/x-fh-variable") ||
      e.dataTransfer.getData("text/plain");
    if (!token || !token.startsWith("{{")) return; // laisse le navigateur gérer
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    const newPos = start + token.length;
    setValue(next, newPos);
    // Repositionner le curseur après le rendu React
    requestAnimationFrame(() => {
      el.focus();
      try {
        el.setSelectionRange(newPos, newPos);
      } catch {
        /* ignore (input type tel/email n'accepte pas setSelectionRange) */
      }
    });
  };
}
