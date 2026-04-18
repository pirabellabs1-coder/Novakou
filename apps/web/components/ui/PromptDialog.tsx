"use client";

/**
 * Global PromptDialog — rendu une seule fois dans le root layout.
 * Remplace window.prompt() par une modale custom stylée Novakou.
 */

import { useEffect, useState } from "react";
import { usePromptStore } from "@/store/prompt";

export default function PromptDialog() {
  const { open, options, respond } = usePromptStore();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset value when modal opens
  useEffect(() => {
    if (open && options) {
      setValue(options.defaultValue ?? "");
      setError(null);
    }
  }, [open, options]);

  // ESC to cancel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") respond(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, respond]);

  if (!open || !options) return null;

  function submit() {
    if (!options) return;
    const v = value.trim();
    if (options.validate) {
      const err = options.validate(v);
      if (err) {
        setError(err);
        return;
      }
    }
    respond(v);
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={() => respond(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#006e2f]/10 text-[#006e2f]">
                <span className="material-symbols-outlined text-[24px]">
                  {options.icon ?? "edit"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-[#191c1e] leading-tight">
                  {options.title}
                </h3>
                {options.message && (
                  <p className="text-sm text-[#5c647a] mt-2 whitespace-pre-wrap">
                    {options.message}
                  </p>
                )}
              </div>
            </div>

            {options.multiline ? (
              <textarea
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder={options.placeholder}
                rows={4}
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border text-sm text-[#191c1e] focus:outline-none focus:ring-2 transition-colors resize-none ${
                  error
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-gray-200 focus:border-[#006e2f] focus:ring-[#006e2f]/10"
                }`}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder={options.placeholder}
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border text-sm text-[#191c1e] focus:outline-none focus:ring-2 transition-colors ${
                  error
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-gray-200 focus:border-[#006e2f] focus:ring-[#006e2f]/10"
                }`}
              />
            )}

            {error && (
              <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => respond(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              {options.cancelLabel ?? "Annuler"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-[#006e2f] hover:bg-[#005a26] text-white transition-colors"
            >
              {options.confirmLabel ?? "Valider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
