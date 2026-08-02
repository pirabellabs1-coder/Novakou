"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, ExternalLink, ChevronDown } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { OperatorLogo, flagEmoji } from "@/components/formations/OperatorLogo";

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

/** Au-delà de ce seuil, les moyens sont paginés plutôt qu'entassés. */
const PER_PAGE = 6;

export function UnifiedPaymentScreen({
  amount,
  currencyLabel = "F CFA",
  merchantName,
  merchantLogoUrl,
  buyerName,
  defaultCountry,
  onPay,
  submitting = false,
  error,
  demoData,
}: {
  amount: number;
  currencyLabel?: string;
  /** Identité affichée = la BOUTIQUE (anonymat vendeur), jamais une personne. */
  merchantName?: string;
  merchantLogoUrl?: string | null;
  buyerName?: string | null;
  defaultCountry?: string | null;
  /** Déclenche le paiement. `phone` est absent pour un moyen hébergé (carte). */
  onPay: (args: { operator: string; phone?: string; hosted: boolean }) => void;
  submitting?: boolean;
  error?: string | null;
  /**
   * Jeu de données factice, RÉSERVÉ à l'aperçu admin : permet de juger le rendu
   * avant d'avoir branché une passerelle. Jamais utilisé côté acheteur — là-bas
   * on n'affiche que des moyens réellement encaissables.
   */
  demoData?: { countries: string[]; options: Option[] };
}) {
  const [country, setCountry] = useState<string>((defaultCountry ?? "").toLowerCase());
  const [countries, setCountries] = useState<Array<{ code: string; operators: number }>>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  // Pays réellement servis (ceux qui ont au moins un moyen encaissable).
  useEffect(() => {
    if (demoData) {
      setCountries(demoData.countries.map((c) => ({ code: c, operators: 0 })));
      setCountry((prev) => prev || demoData.countries[0] || "");
      return;
    }
    fetch("/api/formations/public/payment-options")
      .then((r) => r.json())
      .then((j) => setCountries(j.data?.countries ?? []))
      .catch(() => setCountries([]));
  }, [demoData]);

  // Moyens du pays choisi.
  useEffect(() => {
    if (demoData) {
      setOptions(demoData.options);
      setSelected(demoData.options[0]?.code ?? null);
      setPage(0);
      return;
    }
    if (!country) { setOptions([]); setSelected(null); return; }
    setLoading(true);
    setPage(0);
    fetch(`/api/formations/public/payment-options?country=${encodeURIComponent(country)}`)
      .then((r) => r.json())
      .then((j) => {
        const opts: Option[] = j.data?.options ?? [];
        setOptions(opts);
        setSelected(opts[0]?.code ?? null);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [country, demoData]);

  const current = options.find((o) => o.code === selected) ?? null;
  const needsPhone = current?.family === "mobile_money";
  const countryMeta = COUNTRIES.find((c) => c.code.toLowerCase() === country);
  const dial = countryMeta?.dial ?? "";
  const canPay = Boolean(current) && (!needsPhone || phone.replace(/\D/g, "").length >= 8) && !submitting;

  const pageCount = Math.ceil(options.length / PER_PAGE);
  const visible = useMemo(
    () => options.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [options, page],
  );

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_2px_24px_rgba(16,52,32,.06)] overflow-hidden">
      <div className="grid md:grid-cols-2">
        {/* ── Colonne gauche : marchand + montant ─────────────────────── */}
        <div className="p-8 md:p-10 md:border-r border-gray-100">
          <div className="flex items-center gap-3">
            {merchantLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={merchantLogoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-[#f0faf3] flex items-center justify-center text-[#006e2f] text-lg font-extrabold">
                {(merchantName ?? "N").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-[20px] font-extrabold text-[#191c1e] truncate">
              {merchantName ?? "Novakou"}
            </span>
          </div>

          <p className="text-[19px] font-extrabold text-[#191c1e] mt-9">
            {buyerName ? `Bonjour ${buyerName} !` : "Bonjour !"}
          </p>
          <p className="text-[16px] text-[#5c647a] leading-relaxed mt-2 max-w-sm">
            Vous êtes sur le point d&apos;effectuer un paiement
            {merchantName ? <> chez : <span className="font-semibold text-[#191c1e]">{merchantName}</span></> : null}
          </p>

          <p className="text-[16px] text-[#98a1b3] mt-10">Montant à payer</p>
          <p className="text-[40px] leading-[1.1] font-extrabold text-[#006e2f] tabular-nums mt-1">
            {fmt(amount)}
            <span className="text-[22px] ml-2">{currencyLabel}</span>
          </p>
        </div>

        {/* ── Colonne droite : moyen + numéro + payer ──────────────────── */}
        <div className="p-8 md:p-10">
          <h2 className="text-[24px] font-extrabold text-[#191c1e]">Vos informations</h2>

          {/* Pays */}
          <label className="block text-[15px] font-extrabold text-[#191c1e] mt-7 mb-2.5">
            Votre pays
          </label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPhone(""); }}
              className="w-full appearance-none pl-4 pr-10 py-3.5 rounded-2xl border-2 border-gray-200 text-[15px] font-semibold bg-white outline-none focus:border-[#006e2f] transition-colors"
            >
              <option value="">Choisir mon pays…</option>
              {countries.map((c) => {
                const meta = COUNTRIES.find((x) => x.code.toLowerCase() === c.code);
                return (
                  <option key={c.code} value={c.code}>
                    {flagEmoji(c.code)}  {meta?.name ?? c.code.toUpperCase()}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a1b3] pointer-events-none" />
          </div>

          {/* Moyens */}
          <p className="text-[15px] font-extrabold text-[#191c1e] mt-7 mb-2.5">
            Choisissez votre moyen de paiement
          </p>

          {!country ? (
            <div className="rounded-2xl p-4 text-[13px] font-semibold bg-[#f1f8fe] border border-[#cfe3f5] text-[#0c447c]">
              Sélectionnez d&apos;abord votre pays.
            </div>
          ) : loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-[92px] rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-2xl p-4 text-[13px] font-semibold bg-[#fdf8ec] border border-[#f3e2bd] text-[#8a6100]">
              Aucun moyen de paiement disponible pour ce pays pour le moment.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {visible.map((o) => {
                  const on = selected === o.code;
                  // « Orange Money (Côte d'Ivoire) » → « Orange Money » : le pays
                  // est déjà choisi juste au-dessus, le répéter alourdit la carte.
                  const short = o.label.replace(/\s*\([^)]*\)\s*$/, "");
                  return (
                    <button
                      key={o.code}
                      type="button"
                      onClick={() => { setSelected(o.code); setPhone(""); }}
                      className="flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-2xl bg-white transition-all"
                      style={{
                        border: on ? "2px solid #006e2f" : "2px solid #e9edf1",
                        boxShadow: on ? "0 0 0 4px rgba(0,110,47,.08)" : "none",
                      }}
                    >
                      <OperatorLogo code={o.code} size={34} />
                      <span className="text-[12px] font-bold text-[#191c1e] leading-tight text-center line-clamp-2">
                        {short}
                      </span>
                    </button>
                  );
                })}
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Page ${i + 1}`}
                      onClick={() => setPage(i)}
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: i === page ? 26 : 8,
                        background: i === page ? "#006e2f" : "#dbe1e8",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Mobile Money : numéro saisi ici */}
          {needsPhone && (
            <div className="mt-7">
              <label className="block text-[15px] font-extrabold text-[#191c1e] mb-2.5">
                Numéro de téléphone <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-2xl border-2 border-gray-200 bg-white focus-within:border-[#006e2f] transition-colors overflow-hidden">
                <span className="flex items-center gap-1.5 pl-4 pr-3 py-3.5 text-[15px] font-bold text-[#5c647a] border-r border-gray-200 flex-shrink-0">
                  <span className="text-[18px] leading-none">{flagEmoji(country)}</span>
                  {dial}
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="00 00 00 00"
                  className="flex-1 min-w-0 px-4 py-3.5 text-[15px] font-semibold outline-none"
                />
              </div>
              <p className="text-[12px] font-medium text-[#98a1b3] mt-2">
                Vous recevrez une demande de confirmation sur ce numéro.
              </p>
            </div>
          )}

          {/* Carte : page sécurisée du fournisseur (jamais de saisie chez nous) */}
          {current?.hosted && (
            <div className="mt-7 rounded-2xl p-4 flex items-start gap-3 bg-[#f1f8fe] border border-[#cfe3f5]">
              <ShieldCheck size={17} className="mt-0.5 flex-shrink-0 text-[#0c447c]" />
              <p className="text-[13px] font-semibold text-[#0c447c] leading-relaxed">
                Le paiement par carte s&apos;effectue sur une page bancaire sécurisée. Vos coordonnées
                bancaires ne transitent jamais par Novakou.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 px-4 py-3 rounded-2xl text-[13px] font-semibold bg-rose-50 border border-rose-200 text-rose-800">
              {error}
            </div>
          )}

          <button
            onClick={() => current && onPay({ operator: current.code, phone: needsPhone ? phone : undefined, hosted: current.hosted })}
            disabled={!canPay}
            className="w-full mt-7 py-4 rounded-2xl text-white text-[16px] font-extrabold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            {submitting ? (
              <><Loader2 size={17} className="animate-spin" /> Traitement…</>
            ) : current?.hosted ? (
              <>Payer {fmt(amount)} {currencyLabel} <ExternalLink size={16} /></>
            ) : (
              <>Payer {fmt(amount)} {currencyLabel}</>
            )}
          </button>

          <p className="text-[11px] text-center text-[#98a1b3] mt-3">
            Paiement sécurisé · Des frais opérateur peuvent s&apos;appliquer
          </p>
        </div>
      </div>
    </div>
  );
}
