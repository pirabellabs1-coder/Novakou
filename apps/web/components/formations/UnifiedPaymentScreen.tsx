"use client";

import { useEffect, useState } from "react";
import { Smartphone, CreditCard, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

// ÉCRAN UNIQUE DE PAIEMENT.
//
// L'acheteur choisit son pays, puis voit TOUS les moyens réellement
// encaissables pour ce pays — toutes passerelles confondues, sur un seul écran.
// Il ne sait pas (et n'a pas à savoir) par quelle passerelle transite l'argent :
// le routage est décidé côté serveur par le registre.
//
// Deux comportements selon le moyen :
//   • Mobile Money → saisie du numéro ici même, puis push sur le téléphone.
//   • Carte        → ouverture de la page sécurisée du fournisseur. On
//                    n'affiche JAMAIS de champ « numéro de carte » chez nous :
//                    cela ferait entrer Novakou dans le périmètre PCI-DSS.

type Option = {
  code: string;
  label: string;
  family: "mobile_money" | "card";
  currency: "XOF" | "XAF";
  hosted: boolean;
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export function UnifiedPaymentScreen({
  amount,
  currencyLabel = "F CFA",
  defaultCountry,
  onPay,
  submitting = false,
  error,
}: {
  amount: number;
  currencyLabel?: string;
  defaultCountry?: string | null;
  /** Déclenche le paiement. `phone` est absent pour un moyen hébergé (carte). */
  onPay: (args: { operator: string; phone?: string; hosted: boolean }) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const [country, setCountry] = useState<string>((defaultCountry ?? "").toLowerCase());
  const [countries, setCountries] = useState<Array<{ code: string; operators: number }>>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Pays réellement servis (ceux qui ont au moins un moyen encaissable).
  useEffect(() => {
    fetch("/api/formations/public/payment-options")
      .then((r) => r.json())
      .then((j) => setCountries(j.data?.countries ?? []))
      .catch(() => setCountries([]));
  }, []);

  // Moyens du pays choisi.
  useEffect(() => {
    if (!country) { setOptions([]); setSelected(null); return; }
    setLoading(true);
    fetch(`/api/formations/public/payment-options?country=${encodeURIComponent(country)}`)
      .then((r) => r.json())
      .then((j) => {
        const opts: Option[] = j.data?.options ?? [];
        setOptions(opts);
        setSelected(opts[0]?.code ?? null);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [country]);

  const current = options.find((o) => o.code === selected) ?? null;
  const needsPhone = current?.family === "mobile_money";
  // `dial` inclut déjà le « + » (ex. "+221").
  const dial = COUNTRIES.find((c) => c.code.toLowerCase() === country)?.dial ?? "";
  const canPay = Boolean(current) && (!needsPhone || phone.replace(/\D/g, "").length >= 8) && !submitting;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-7">
      <div className="mb-5">
        <p className="text-[12px] font-semibold text-[#5c647a]">Total</p>
        <p className="text-3xl font-extrabold text-[#006e2f]">
          {fmt(amount)} {currencyLabel}
        </p>
      </div>

      {/* 1. Pays */}
      <label className="block text-[12px] font-extrabold text-[#191c1e] mb-1.5">Votre pays</label>
      <select
        value={country}
        onChange={(e) => { setCountry(e.target.value); setPhone(""); }}
        className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold mb-5"
      >
        <option value="">Choisir mon pays…</option>
        {countries.map((c) => {
          const meta = COUNTRIES.find((x) => x.code.toLowerCase() === c.code);
          return (
            <option key={c.code} value={c.code}>
              {meta?.name ?? c.code.toUpperCase()}
            </option>
          );
        })}
      </select>

      {/* 2. Moyens disponibles */}
      <label className="block text-[12px] font-extrabold text-[#191c1e] mb-1.5">Moyen de paiement</label>

      {!country ? (
        <div className="rounded-xl p-3 text-[12px] font-bold bg-[#f1f8fe] border border-[#cfe3f5] text-[#0c447c]">
          Sélectionnez d&apos;abord votre pays.
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-4 text-[12px] font-semibold text-[#5c647a]">
          <Loader2 size={15} className="animate-spin" /> Chargement des moyens disponibles…
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-xl p-3 text-[12px] font-bold bg-[#fdf8ec] border border-[#f3e2bd] text-[#8a6100]">
          Aucun moyen de paiement disponible pour ce pays pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map((o) => {
            const on = selected === o.code;
            const Icon = o.family === "card" ? CreditCard : Smartphone;
            return (
              <button
                key={o.code}
                type="button"
                onClick={() => { setSelected(o.code); setPhone(""); }}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-colors"
                style={{
                  border: on ? "2px solid #006e2f" : "2px solid #e5e7eb",
                  background: on ? "#f0faf3" : "#fff",
                }}
              >
                <Icon size={20} style={{ color: "#006e2f" }} />
                <span className="text-[11px] font-extrabold text-[#191c1e] leading-tight">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3a. Mobile Money : numéro saisi ici */}
      {needsPhone && (
        <div className="mt-5">
          <label className="block text-[12px] font-extrabold text-[#191c1e] mb-1.5">
            Numéro de téléphone <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {dial && (
              <span className="px-3 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-[#5c647a] flex-shrink-0">
                {dial}
              </span>
            )}
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Votre numéro"
              className="flex-1 min-w-0 px-3.5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold"
            />
          </div>
          <p className="text-[11px] font-semibold text-[#5c647a] mt-1.5">
            Vous recevrez une demande de confirmation sur ce numéro.
          </p>
        </div>
      )}

      {/* 3b. Carte : page sécurisée du fournisseur (jamais de saisie chez nous) */}
      {current?.hosted && (
        <div className="mt-5 rounded-xl p-3 flex items-start gap-2.5 bg-[#f1f8fe] border border-[#cfe3f5]">
          <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-[#0c447c]" />
          <p className="text-[12px] font-semibold text-[#0c447c]">
            Le paiement par carte s&apos;effectue sur une page bancaire sécurisée. Vos coordonnées
            bancaires ne transitent jamais par Novakou.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 px-3 py-2.5 rounded-xl text-[12px] font-semibold bg-rose-50 border border-rose-200 text-rose-800">
          {error}
        </div>
      )}

      <button
        onClick={() => current && onPay({ operator: current.code, phone: needsPhone ? phone : undefined, hosted: current.hosted })}
        disabled={!canPay}
        className="w-full mt-5 py-3.5 rounded-xl text-white text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
      >
        {submitting ? (
          <><Loader2 size={16} className="animate-spin" /> Traitement…</>
        ) : current?.hosted ? (
          <>Payer {fmt(amount)} {currencyLabel} <ExternalLink size={15} /></>
        ) : (
          <>Payer {fmt(amount)} {currencyLabel}</>
        )}
      </button>

      <p className="text-[10px] text-center text-[#5c647a] mt-2.5">
        Paiement sécurisé · Des frais opérateur peuvent s&apos;appliquer
      </p>
    </div>
  );
}
