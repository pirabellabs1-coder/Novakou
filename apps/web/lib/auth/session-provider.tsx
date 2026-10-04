"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * `refetchOnWindowFocus={false}` : par défaut NextAuth rappelle
 * `/api/auth/session` à CHAQUE retour sur l'onglet, pour tous les visiteurs —
 * une exécution de fonction à chaque changement d'onglet. La session reste
 * lue au chargement de la page, et la connexion/déconnexion dans un autre
 * onglet est toujours propagée (NextAuth synchronise les onglets entre eux).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider refetchOnWindowFocus={false}>{children}</NextAuthSessionProvider>;
}
