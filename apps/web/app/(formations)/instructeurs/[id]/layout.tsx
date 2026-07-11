import type { Metadata } from "next";

/**
 * L'ancien profil instructeur redirige désormais vers la boutique du vendeur
 * (voir page.tsx). On garde un layout minimal, non indexé.
 */
export const metadata: Metadata = {
  title: "Redirection…",
  robots: { index: false, follow: false },
};

export default function InstructeurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
