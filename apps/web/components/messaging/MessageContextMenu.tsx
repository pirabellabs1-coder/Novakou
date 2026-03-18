"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const DELETE_WINDOW_MS = 10 * 60 * 1000;

interface MessageContextMenuProps {
  messageCreatedAt: string;
  isOwn: boolean;
  isDeleted: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function MessageContextMenu({
  messageCreatedAt,
  isOwn,
  isDeleted,
  onEdit,
  onDelete,
}: MessageContextMenuProps) {
  const [open, setOpen] = useState(false);

  if (!isOwn || isDeleted) return null;

  const elapsed = Date.now() - new Date(messageCreatedAt).getTime();
  const canEdit = elapsed < EDIT_WINDOW_MS;
  const canDelete = elapsed < DELETE_WINDOW_MS;

  if (!canEdit && !canDelete) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Options du message"
      >
        <span className="material-symbols-outlined text-base">more_vert</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 bg-neutral-dark border border-border-dark rounded-lg shadow-xl py-1 min-w-[160px]">
            {canEdit && (
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Modifier
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Supprimer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
