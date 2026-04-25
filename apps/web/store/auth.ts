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
  impersonationExpiresAt: number | null;
  startImpersonation: (user: ImpersonatedUser, expiresAt: number) => void;
  stopImpersonation: () => void;
  isImpersonating: () => boolean;
}

let _expiryTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  impersonatedUser: null,
  impersonationExpiresAt: null,

  startImpersonation: (user, expiresAt) => {
    // Clear any existing timer
    if (_expiryTimer) clearTimeout(_expiryTimer);

    const msRemaining = expiresAt - Date.now();
    if (msRemaining <= 0) {
      // Already expired — do not start
      return;
    }

    // Auto-clear impersonation when the 30-minute window expires
    _expiryTimer = setTimeout(() => {
      set({ impersonatedUser: null, impersonationExpiresAt: null });
      _expiryTimer = null;
    }, msRemaining);

    set({ impersonatedUser: user, impersonationExpiresAt: expiresAt });
  },

  stopImpersonation: () => {
    if (_expiryTimer) {
      clearTimeout(_expiryTimer);
      _expiryTimer = null;
    }
    set({ impersonatedUser: null, impersonationExpiresAt: null });
  },

  isImpersonating: () => {
    const state = get();
    if (!state.impersonatedUser) return false;
    // Check expiry
    if (state.impersonationExpiresAt && Date.now() >= state.impersonationExpiresAt) {
      // Expired — clear state
      if (_expiryTimer) {
        clearTimeout(_expiryTimer);
        _expiryTimer = null;
      }
      set({ impersonatedUser: null, impersonationExpiresAt: null });
      return false;
    }
    return true;
  },
}));
