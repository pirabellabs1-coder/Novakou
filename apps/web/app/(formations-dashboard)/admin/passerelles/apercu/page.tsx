"use client";

import { useState } from "react";
import Link from "next/link";
import { ST, StPageHeader, StCard, StChip } from "@/components/stitch";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import { ArrowLeft, Eye } from "lucide-react";

/**
 * Aperçu de l'écran de paiement, tel que l'acheteur le verra.
 *
 * Branché sur les VRAIES données : les pays et les moyens affichés viennent des
 * passerelles réellement activées dans /admin/passerelles. Si la liste est
 * vide, c'est que rien n'est encore branché — l'aperçu ne triche pas avec des
 * moyens fictifs, sinon il donnerait une fausse impression de couverture.
 *
 * Le bouton « Payer » ne déclenche AUCUN paiement ici : c'est une simulation.
 */
/**
 * Jeu de démonstration : sert UNIQUEMENT à juger le rendu avant d'avoir branché
 * une passerelle. Les codes sont de vrais codes du registre, pour que l'aperçu
 * montre les mêmes pastilles que la production.
 */
const DEMO = {
  countries: ["ci", "sn", "bj", "ml", "cm"],
  options: [
    { code: "orange_ci", label: "Orange Money (Côte d'Ivoire)", family: "mobile_money" as const, currency: "XOF" as const, hosted: false },
    { code: "wave_ci", label: "Wave (Côte d'Ivoire)", family: "mobile_money" as const, currency: "XOF" as const, hosted: false },
    { code: "mtn_ci", label: "MTN Mobile Money (Côte d'Ivoire)", family: "mobile_money" as const, currency: "XOF" as const, hosted: false },
    { code: "moov_ci", label: "Moov Money (Côte d'Ivoire)", family: "mobile_money" as const, currency: "XOF" as const, hosted: false },
    { code: "card_xof", label: "Carte bancaire (XOF)", family: "card" as const, currency: "XOF" as const, hosted: true },
  ],
};

export default function ApercuPaiementPage() {
  const [amount, setAmount] = useState(8000);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [demo, setDemo] = useState(true);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <Link
        href="/admin/passerelles"
        className="text-xs font-semibold inline-flex items-center gap-1 mb-6"
        style={{ color: ST.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        Passerelles
      </Link>

      <StPageHeader
        title="Aperçu de l'écran de paiement"
        subtitle="Ce que voit l'acheteur. Les pays et moyens proposés proviennent des passerelles réellement activées — aucun moyen fictif n'est affiché."
      />

      <StCard className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <StChip tone="blue" icon={Eye}>Simulation — aucun paiement n&apos;est déclenché</StChip>
          <label className="flex items-center gap-2 text-[13px] font-bold" style={{ color: ST.text }}>
            Montant à simuler
            <input
              type="number"
              value={amount}
              min={100}
              step={500}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-32 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold"
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer" style={{ color: ST.text }}>
            <input type="checkbox" className="w-4 h-4" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
            Données de démonstration
          </label>
        </div>
        <p className="text-[11px] font-semibold mt-2" style={{ color: ST.textSecondary }}>
          {demo
            ? "Moyens factices, pour juger le rendu. Décochez pour voir ce que verra réellement l'acheteur."
            : "Données réelles : ces moyens proviennent des passerelles activées. Liste vide = aucune passerelle branchée."}
        </p>
        {lastAction && (
          <p className="text-[12px] font-semibold mt-3" style={{ color: ST.green }}>
            {lastAction}
          </p>
        )}
      </StCard>

      <UnifiedPaymentScreen
        amount={amount}
        merchantName="Ma Boutique"
        buyerName="Elias"
        demoData={demo ? DEMO : undefined}
        onPay={({ operator, phone, hosted }) =>
          setLastAction(
            hosted
              ? `Simulation : « ${operator} » → redirection vers la page bancaire sécurisée.`
              : `Simulation : « ${operator} » → demande de confirmation envoyée au ${phone || "—"}.`,
          )
        }
      />

      <p className="text-[11px] font-semibold text-center mt-6" style={{ color: ST.textSecondary }}>
        Aucun nom de passerelle n&apos;apparaît sur cet écran : par quel prestataire transite
        l&apos;argent est un détail d&apos;infrastructure, invisible pour l&apos;acheteur.
      </p>
    </div>
  );
}
