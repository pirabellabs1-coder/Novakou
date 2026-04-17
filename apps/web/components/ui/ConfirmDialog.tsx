"use client";

/**
 * Global ConfirmDialog — rendu une seule fois dans le root layout.
 * Remplace window.confirm() par une vraie modale custom.
 */

import { useEffect } from "react";
import { useConfirmStore } from "@/store/confirm";

export default function ConfirmDialog() {
  const { open, options, respond } = useConfirmStore();

  // ESC to cancel, Enter to confirm
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") respond(false);
      if (e.key === "Enter") respond(true);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, respond]);

  if (!open || !options) return null;

  const variant = options.confirmVariant ?? "default";
  const variantClasses: Record<string, { bg: string; icon: string; iconBg: string }> = {
    danger: {
      bg: "bg-red-600 hover:bg-red-700 text-white",
      icon: options.icon ?? "warning",
      iconBg: "bg-red-50 text-red-600",
    },
    warning: {
      bg: "bg-amber-500 hover:bg-amber-600 text-white",
      icon: options.icon ?? "warning",
      iconBg: "bg-amber-50 text-amber-600",
    },
    default: {
      bg: "bg-[#006e2f] hover:bg-[#005a26] text-white",
      icon: options.icon ?? "help",
      iconBg: "bg-[#006e2f]/10 text-[#006e2f]",
    },
  };
  const v = variantClasses[variant];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={() => respond(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${v.iconBg}`}>
              <span className="material-symbols-outlined text-[24px]">{v.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-extrabold text-[#191c1e] leading-tight">
                {options.title}
              </h3>
              <p className="text-sm text-[#5c647a] mt-2 whitespace-pre-wrap">{options.message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={() => respond(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
          >
            {options.cancelLabel ?? "Annuler"}
          </button>
          <button
            onClick={() => respond(true)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${v.bg}`}
            autoFocus
          >
            {options.confirmLabel ?? "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
