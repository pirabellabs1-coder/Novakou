import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CheckoutInner from "./CheckoutInner";

// `Suspense` fonctionne aussi dans un composant serveur : seule la partie
// interactive a besoin d'être cliente. La page peut donc porter ses propres
// métadonnées, ce qu'un composant client ne sait pas faire.
export const metadata: Metadata = {
  title: "Finaliser votre commande",
  description: "Paiement sécurisé de votre commande sur Novakou.",
  // Une page de commande est propre à un panier : ni indexée, ni partagée.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <Loader2 size={48} className="text-zinc-300 animate-spin" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
