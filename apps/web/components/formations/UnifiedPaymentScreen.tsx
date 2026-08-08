"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, ExternalLink, ChevronDown, Check } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { checkNationalNumber } from "@/lib/payments/phone-rules";
import { detecterPaysAffichage, paysAffichageCourant } from "@/components/formations/SelecteurDevise";
import { OperatorLogo } from "@/components/formations/OperatorLogo";
import { CountryFlag, NovakouLogo } from "@/components/formations/CountryFlag";

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

/** « Orange Money (Côte d'Ivoire) » → « Orange Money » : le pays est déjà
 *  choisi juste au-dessus, le répéter alourdit la ligne. */
const shortLabel = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");

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
  embedded = false,
  hideSubmit = false,
  onSelectionChange,
  direction = "collect",
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
  /**
   * Mode INTÉGRÉ : rend uniquement le bloc de sélection (pays, moyen, numéro),
   * sans la colonne marchand ni l'encadré. À utiliser quand la page affiche
   * déjà le récapitulatif et son propre bouton de paiement — le tunnel tient
   * alors sur UNE seule page au lieu de deux écrans successifs.
   */
  embedded?: boolean;
  /** Masque le bouton du composant : la page hôte fournit le sien. */
  hideSubmit?: boolean;
  /**
   * Remonte la sélection courante à chaque changement, pour que le bouton de
   * la page hôte sache quoi envoyer et s'il peut être activé.
   */
  onSelectionChange?: (sel: { operator: string; phone?: string; hosted: boolean } | null) => void;
  /**
   * Sens de l'opération. « payout » sert les écrans de RETRAIT (vendeur,
   * affilié, mentor) : mêmes gestes pour le vendeur que pour l'acheteur —
   * choisir son pays, voir les moyens réellement disponibles, saisir son
   * numéro. Un second écran aurait divergé du premier au premier correctif.
   */
  direction?: "collect" | "payout";
}) {
  const [country, setCountry] = useState<string>((defaultCountry ?? "").toLowerCase());
  const [countries, setCountries] = useState<Array<{ code: string; operators: number }>>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const methodRef = useRef<HTMLDivElement>(null);

  // Même comportement de fermeture pour la liste des moyens.
  useEffect(() => {
    if (!methodOpen) return;
    const onClick = (e: MouseEvent) => {
      if (methodRef.current && !methodRef.current.contains(e.target as Node)) setMethodOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMethodOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [methodOpen]);

  // Fermeture de la liste des pays au clic extérieur / touche Échap.
  useEffect(() => {
    if (!countryOpen) return;
    const onClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCountryOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [countryOpen]);

  // Pays réellement servis (ceux qui ont au moins un moyen encaissable).
  useEffect(() => {
    if (demoData) {
      setCountries(demoData.countries.map((c) => ({ code: c, operators: 0 })));
      setCountry((prev) => prev || demoData.countries[0] || "");
      return;
    }
    fetch(direction === "payout" ? "/api/formations/payout-options" : "/api/formations/public/payment-options")
      .then((r) => r.json())
      .then(async (j) => {
        const liste: Array<{ code: string; operators: number }> = j.data?.countries ?? [];
        setCountries(liste);
        // Pré-sélection : le pays du visiteur (choisi dans le sélecteur de
        // devise, sinon détecté par l'IP), s'il est réellement servi. Un
        // Ivoirien n'a plus à chercher son pays dans la liste — et s'il en a
        // déjà désigné un (prop ou geste), on n'y touche pas.
        await detecterPaysAffichage().catch(() => null);
        const defaut = paysAffichageCourant().toLowerCase();
        if (liste.some((c) => c.code === defaut)) setCountry((prev) => prev || defaut);
      })
      .catch(() => setCountries([]));
  }, [demoData, direction]);

  // Moyens du pays choisi.
  useEffect(() => {
    if (demoData) {
      setOptions(demoData.options);
      setSelected(demoData.options[0]?.code ?? null);
      return;
    }
    if (!country) { setOptions([]); setSelected(null); return; }
    setLoading(true);
    fetch(
      direction === "payout"
        ? `/api/formations/payout-options?country=${encodeURIComponent(country)}`
        : `/api/formations/public/payment-options?country=${encodeURIComponent(country)}`,
    )
      .then((r) => r.json())
      .then((j) => {
        const opts: Option[] = j.data?.options ?? [];
        setOptions(opts);
        setSelected(opts[0]?.code ?? null);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [country, demoData, direction]);

  const current = options.find((o) => o.code === selected) ?? null;
  const needsPhone = current?.family === "mobile_money";
  const countryMeta = COUNTRIES.find((c) => c.code.toLowerCase() === country);
  const dial = countryMeta?.dial ?? "";

  // Longueur du numéro vérifiée PAYS PAR PAYS, avant tout appel serveur. Le
  // 2026-08-08, un acheteur a choisi « Sénégal » avec son numéro ivoirien à
  // 10 chiffres : la passerelle a répondu « MSISDN too long » après l'échec.
  // Ici on refuse AVANT, avec un message qui dit quoi corriger — et l'erreur
  // ne s'affiche qu'une fois le numéro trop long, jamais pendant la frappe.
  const phoneCheck = needsPhone ? checkNationalNumber(country, phone) : null;
  const phoneError = phoneCheck && !phoneCheck.ok ? phoneCheck.error : "";
  const phoneOk = !needsPhone || Boolean(phoneCheck?.ok);
  const canPay = Boolean(current) && phoneOk && !submitting;

  // Sélection complète, telle qu'elle serait envoyée. Null tant qu'il manque
  // quelque chose — c'est ce qui permet à la page hôte de désactiver son bouton.
  // Le numéro part NORMALISÉ (zéro de composition retiré : « 0712… » au Kenya
  // devient 712…), sinon la passerelle reçoit un chiffre de trop.
  const selection = current && phoneOk
    ? {
        operator: current.code,
        phone: needsPhone && phoneCheck?.ok ? dial.replace(/\D/g, "") + phoneCheck.national : undefined,
        hosted: current.hosted,
      }
    : null;
  const selRef = useRef<string>("");
  useEffect(() => {
    const key = JSON.stringify(selection);
    if (key === selRef.current) return;
    selRef.current = key;
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

  const colonneSelection = (
    <>
        {/* ── Colonne droite : moyen + numéro + payer ──────────────────── */}
        <div className={embedded ? "" : "p-6 sm:p-8 md:p-10"}>
          {!embedded && (
            <h2 className="text-[24px] font-extrabold text-[#191c1e]">
              {direction === "payout" ? "Votre retrait" : "Vos informations"}
            </h2>
          )}

          {/* Pays */}
          <label className="block text-[15px] font-extrabold text-[#191c1e] mt-7 mb-2.5">
            Votre pays
          </label>
          {/* Liste déroulante maison : un <select> natif ne peut pas afficher
              d'image, donc pas de vrai drapeau. */}
          <div className="relative" ref={countryRef}>
            <button
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              className="w-full flex items-center gap-3 pl-4 pr-10 py-3.5 rounded-2xl border-2 bg-white text-[15px] font-semibold text-left transition-colors"
              style={{ borderColor: countryOpen ? "#006e2f" : "#e5e7eb" }}
            >
              {country ? (
                <>
                  <CountryFlag code={country} />
                  <span className="text-[#191c1e] truncate">{countryMeta?.name ?? country.toUpperCase()}</span>
                </>
              ) : (
                <span className="text-[#98a1b3]">Choisir mon pays…</span>
              )}
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a1b3] transition-transform"
                style={{ transform: `translateY(-50%) rotate(${countryOpen ? 180 : 0}deg)` }}
              />
            </button>

            {countryOpen && (
              <div className="absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl border-2 border-gray-100 bg-white shadow-xl py-1.5">
                {countries.length === 0 && (
                  <p className="px-4 py-3 text-[13px] font-semibold text-[#98a1b3]">
                    Aucun pays disponible pour le moment.
                  </p>
                )}
                {countries.map((c) => {
                  const meta = COUNTRIES.find((x) => x.code.toLowerCase() === c.code);
                  const on = c.code === country;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setCountry(c.code); setPhone(""); setCountryOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-left hover:bg-[#f5f8f6] transition-colors"
                      style={{ color: on ? "#006e2f" : "#191c1e" }}
                    >
                      <CountryFlag code={c.code} />
                      <span className="flex-1 truncate">{meta?.name ?? c.code.toUpperCase()}</span>
                      {on && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Moyens */}
          <p className="text-[15px] font-extrabold text-[#191c1e] mt-7 mb-2.5">
            {direction === "payout" ? "Choisissez votre moyen de retrait" : "Choisissez votre moyen de paiement"}
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
            /* Liste déroulante plutôt qu'une grille : avec une dizaine
               d'opérateurs la page devenait interminable, surtout sur mobile.
               Un seul moyen visible à la fois, la liste s'ouvre au besoin. */
            <div className="relative" ref={methodRef}>
              <button
                type="button"
                onClick={() => setMethodOpen((v) => !v)}
                className="w-full flex items-center gap-3 pl-4 pr-10 py-3 rounded-2xl border-2 bg-white text-left transition-colors"
                style={{ borderColor: methodOpen ? "#006e2f" : "#e5e7eb" }}
              >
                {current ? (
                  <>
                    <OperatorLogo code={current.code} size={30} />
                    <span className="text-[15px] font-semibold text-[#191c1e] truncate">
                      {shortLabel(current.label)}
                    </span>
                  </>
                ) : (
                  <span className="text-[15px] font-semibold text-[#98a1b3]">Choisir un moyen…</span>
                )}
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a1b3] transition-transform"
                  style={{ transform: `translateY(-50%) rotate(${methodOpen ? 180 : 0}deg)` }}
                />
              </button>

              {methodOpen && (
                <div className="absolute z-20 left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl border-2 border-gray-100 bg-white shadow-xl py-1.5">
                  {options.map((o) => {
                    const on = selected === o.code;
                    return (
                      <button
                        key={o.code}
                        type="button"
                        onClick={() => { setSelected(o.code); setPhone(""); setMethodOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f5f8f6] transition-colors"
                        style={{ color: on ? "#006e2f" : "#191c1e" }}
                      >
                        <OperatorLogo code={o.code} size={28} />
                        <span className="flex-1 text-[14px] font-semibold truncate">{shortLabel(o.label)}</span>
                        {on && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mobile Money : numéro saisi ici */}
          {needsPhone && (
            <div className="mt-7">
              <label className="block text-[15px] font-extrabold text-[#191c1e] mb-2.5">
                Numéro de téléphone <span className="text-rose-500">*</span>
              </label>
              {/* Un style en ligne écraserait aussi le vert du focus : on ne
                  force le rouge que lorsqu'il y a réellement une erreur. */}
              <div
                className="flex items-center rounded-2xl border-2 border-gray-200 bg-white focus-within:border-[#006e2f] transition-colors overflow-hidden"
                style={phoneError ? { borderColor: "#fda4af" } : undefined}
              >
                <span className="flex items-center gap-2 pl-4 pr-3 py-3.5 text-[15px] font-bold text-[#5c647a] border-r border-gray-200 flex-shrink-0">
                  <CountryFlag code={country} />
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
              {phoneError ? (
                <p className="text-[12px] font-semibold text-rose-600 mt-2">{phoneError}</p>
              ) : (
                <p className="text-[12px] font-medium text-[#98a1b3] mt-2">
                  {direction === "payout"
                    ? "L'argent sera envoyé sur ce numéro. Vérifiez-le : un versement parti ne se rattrape pas."
                    : "Vous recevrez une demande de confirmation sur ce numéro."}
                </p>
              )}
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

          {!hideSubmit && (
          <button
            // `selection` porte le numéro COMPLET (indicatif + local). Envoyer
            // le numéro local, comme avant, faisait partir « 0157335726 » au
            // lieu de « 2290157335726 » : la passerelle ne pouvait pas joindre
            // le bon abonné.
            onClick={() => selection && onPay(selection)}
            disabled={!canPay || !selection}
            className="w-full mt-7 py-4 rounded-2xl text-white text-[16px] font-extrabold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            {submitting ? (
              <><Loader2 size={17} className="animate-spin" /> Traitement…</>
            ) : current?.hosted ? (
              <>Payer {fmt(amount)} {currencyLabel} <ExternalLink size={16} /></>
            ) : (
              <>{direction === "payout" ? "Retirer" : "Payer"} {fmt(amount)} {currencyLabel}</>
            )}
          </button>
          )}

          {!hideSubmit && (
            <p className="text-[11px] text-center text-[#98a1b3] mt-3">
              Paiement sécurisé · Des frais opérateur peuvent s&apos;appliquer
            </p>
          )}
        </div>
    </>
  );

  if (embedded) {
    // Page hôte : elle affiche déjà le récapitulatif et son propre bouton.
    // On ne rend que la sélection, sans encadré ni colonne marchand.
    return <div className="min-w-0">{colonneSelection}</div>;
  }

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_2px_24px_rgba(16,52,32,.06)] overflow-hidden">
      {/*
        `min-w-0` sur les colonnes n'est PAS cosmétique. Un élément de grille a
        `min-width: auto` par défaut : la piste s'élargit jusqu'à la largeur
        minimale de son contenu, même si la grille, elle, est plus étroite. Sur
        téléphone la colonne réclamait 403 px dans un écran de 375 — et comme le
        conteneur parent masque le débordement, l'écran de paiement était
        simplement COUPÉ à droite : montant et bouton « Payer » hors champ.
      */}
      <div className="grid md:grid-cols-2 [&>*]:min-w-0">
        {/* ── Colonne gauche : marchand + montant ─────────────────────── */}
        <div className="p-6 sm:p-8 md:p-10 md:border-r border-gray-100">
          <div className="flex items-center gap-3">
            {merchantLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={merchantLogoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-[#f0faf3] flex items-center justify-center text-[#006e2f] text-lg font-extrabold">
                {(merchantName ?? "N").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-[20px] font-extrabold text-[#191c1e] truncate min-w-0">
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

          {/* Marque de la plateforme : rassure l'acheteur sur qui sécurise la
              transaction, sans voler la vedette à la boutique en haut. */}
          <div className="flex items-center gap-2 mt-10 pt-6 border-t border-gray-100">
            <NovakouLogo size={22} />
            <span className="text-[12px] font-semibold text-[#98a1b3]">
              Paiement sécurisé par <span className="text-[#5c647a] font-bold">Novakou</span>
            </span>
          </div>
        </div>

        {colonneSelection}
      </div>
    </div>
  );
}
