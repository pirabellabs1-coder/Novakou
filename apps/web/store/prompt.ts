import { create } from "zustand";

/**
 * Prompt dialog store — remplace window.prompt() avec une vraie modale custom.
 *
 * Usage :
 *   import { promptAction } from "@/store/prompt";
 *
 *   const value = await promptAction({
 *     title: "Titre du nouveau module",
 *     placeholder: "Ex : Introduction",
 *     defaultValue: "Module 3",
 *     confirmLabel: "Créer",
 *   });
 *   // value === null si annulé, sinon string (peut être vide)
 */

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Validation : retourne un message d'erreur, ou null si valide */
  validate?: (value: string) => string | null;
  icon?: string;
  multiline?: boolean;
}

interface PromptState {
  open: boolean;
  options: PromptOptions | null;
  resolver: ((value: string | null) => void) | null;
  prompt: (options: PromptOptions) => Promise<string | null>;
  respond: (value: string | null) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  open: false,
  options: null,
  resolver: null,
  prompt: (options) =>
    new Promise<string | null>((resolve) => {
      set({ open: true, options, resolver: resolve });
    }),
  respond: (value) => {
    const { resolver } = get();
    resolver?.(value);
    set({ open: false, options: null, resolver: null });
  },
}));

/** Helper shortcut — utilisable directement comme `await promptAction({...})` */
export function promptAction(options: PromptOptions): Promise<string | null> {
  return usePromptStore.getState().prompt(options);
}
