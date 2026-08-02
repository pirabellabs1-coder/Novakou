import "../(formations)/formations.css";
import { Inter } from "next/font/google";
import { ToastContainer } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Layout des LIENS DE PAIEMENT (/payer/[slug]).
 *
 * Volontairement MINIMAL : pas de navbar Novakou (méga-menus) ni de footer
 * marketplace — un lien de paiement doit être un checkout épuré et focalisé
 * (confiance + conversion, aucune distraction pour l'acheteur). La page
 * PayerClient porte déjà son propre badge « Paiement sécurisé » et la mention
 * « Propulsé par Novakou ».
 */
export default function PaylinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} formations-root flex min-h-screen flex-col bg-[#f7f9fb]`}
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <ToastContainer />
    </div>
  );
}
