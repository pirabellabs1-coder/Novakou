import { create } from "zustand";

/**
 * Confirm dialog store — remplace window.confirm() avec une vraie modale custom.
 *
 * Usage :
 *   import { useConfirmStore } from "@/store/confirm";
 *
 *   const ok = await useConfirmStore.getState().confirm({
 *     title: "Supprimer cet élément ?",
 *     message: "Cette action est irréversible.",
 *     confirmLabel: "Supprimer",
 *     confirmVariant: "danger",
 *   });
 *   if (ok) {
 *     // user clicked Confirm
 *   }
 */

export type ConfirmVariant = "default" | "danger" | "warning";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
  icon?: string;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolver: ((ok: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  respond: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolver: null,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, options, resolver: resolve });
    }),
  respond: (ok) => {
    const { resolver } = get();
    resolver?.(ok);
    set({ open: false, options: null, resolver: null });
  },
}));

/** Helper shortcut — on peut appeler `confirmAction(...)` directement */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().confirm(options);
}
