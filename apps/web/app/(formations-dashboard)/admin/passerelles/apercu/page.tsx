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
export default function ApercuPaiementPage() {
  const [amount, setAmount] = useState(8000);
  const [lastAction, setLastAction] = useState<string | null>(null);

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
        </div>
        {lastAction && (
          <p className="text-[12px] font-semibold mt-3" style={{ color: ST.green }}>
            {lastAction}
          </p>
        )}
      </StCard>

      <div className="max-w-lg mx-auto">
        <UnifiedPaymentScreen
          amount={amount}
          onPay={({ operator, phone, hosted }) =>
            setLastAction(
              hosted
                ? `Simulation : « ${operator} » → redirection vers la page bancaire sécurisée.`
                : `Simulation : « ${operator} » → demande de confirmation envoyée au ${phone || "—"}.`,
            )
          }
        />
      </div>

      <p className="text-[11px] font-semibold text-center mt-6" style={{ color: ST.textSecondary }}>
        Aucun nom de passerelle n&apos;apparaît sur cet écran : par quel prestataire transite
        l&apos;argent est un détail d&apos;infrastructure, invisible pour l&apos;acheteur.
      </p>
    </div>
  );
}
