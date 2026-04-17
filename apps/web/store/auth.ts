// ============================================================
// Novakou — Auth & Impersonation Store
// Gere l'etat d'impersonation admin
// ============================================================

import { create } from "zustand";

interface ImpersonatedUser {
  id: string;
  name: string;
  role: "freelance" | "client" | "agence";
  email: string;
}

interface AuthState {
  impersonatedUser: ImpersonatedUser | null;
  startImpersonation: (user: ImpersonatedUser) => void;
  stopImpersonation: () => void;
  isImpersonating: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  impersonatedUser: null,

  startImpersonation: (user) => set({ impersonatedUser: user }),

  stopImpersonation: () => set({ impersonatedUser: null }),

  isImpersonating: () => get().impersonatedUser !== null,
}));
