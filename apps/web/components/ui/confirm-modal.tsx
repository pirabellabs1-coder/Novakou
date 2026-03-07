"use client";

import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  open?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmModal({
  open = true,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "primary",
  danger,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const resolvedVariant = danger ? "danger" : variant;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-background-dark border border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              resolvedVariant === "danger" ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"
            )}
          >
            <span className="material-symbols-outlined">
              {resolvedVariant === "danger" ? "warning" : "help"}
            </span>
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        {children}
        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 bg-border-dark rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2.5 text-sm font-bold rounded-lg transition-colors",
              resolvedVariant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
