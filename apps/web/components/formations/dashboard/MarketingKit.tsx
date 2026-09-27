"use client";

/**
 * MarketingKit — briques partagées par les pages « Outils marketing » de
 * l'espace vendeur (pop-ups, campagnes, pixels, affiliation, séquences).
 *
 * Pourquoi un fichier commun : chacune de ces pages redéclarait son propre
 * interrupteur (un `<button>` nu, sans nom accessible ni état annoncé) et sa
 * propre modale (sans rôle, sans Échap, sans piège à focus). Cinq copies d'un
 * même défaut d'accessibilité. Ici, une seule implémentation, testée au
 * clavier, dans la langue visuelle du design system « Stitch ».
 */

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw, X } from "lucide-react";
import { ST, StButton, StCard } from "@/components/stitch";

/* ───────────────────────── Interrupteur accessible ───────────────────── */

/**
 * Interrupteur on/off. `role="switch"` + `aria-checked` : un lecteur d'écran
 * annonce « Pop-up actif, case cochée » et non « bouton » sans nom. La cible
 * fait 44 px de haut au doigt (zone tactile) pour un rendu visuel de 20 px.
 */
export function StSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (valeur: boolean) => void;
  /** Nom accessible, ex. « Activer le pop-up Bienvenue ». */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/[.04] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span
        aria-hidden="true"
        className="relative block h-5 w-10 rounded-full transition-colors duration-200 motion-reduce:transition-none"
        style={{ background: checked ? ST.greenBright : "#dbe3dd" }}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 motion-reduce:transition-none ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/* ───────────────────────── Modale accessible ─────────────────────────── */

/**
 * Boîte de dialogue : rôle explicite, titre relié, fermeture à la touche Échap,
 * focus placé dedans à l'ouverture, piégé pendant, rendu à l'élément d'origine
 * à la fermeture. Le défilement de la page est bloqué pendant l'ouverture.
 */
export function StModal({
  titre,
  onClose,
  children,
  pied,
  large = false,
}: {
  titre: string;
  onClose: () => void;
  children: ReactNode;
  pied?: ReactNode;
  large?: boolean;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const titreId = useId();

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focalisables = () =>
      Array.from(
        boite.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focalisables()[0]?.focus();

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const cibles = focalisables();
      if (cibles.length === 0) return;
      const premier = cibles[0];
      const dernier = cibles[cibles.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };

    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("keydown", auClavier);
      document.body.style.overflow = overflowInitial;
      precedent?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#0b3b20]/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={boite}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        className={`relative w-full ${large ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto bg-white rounded-t-[20px] sm:rounded-[20px] shadow-[0_24px_60px_rgba(11,59,32,.22)]`}
        style={{ border: `1px solid ${ST.cardBorder}`, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white px-5 sm:px-6 py-4"
          style={{ borderBottom: `1px solid ${ST.divider}` }}
        >
          <h2 id={titreId} className="text-[16.5px] font-extrabold" style={{ color: ST.text }}>
            {titre}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[.05]"
            style={{ color: ST.textSecondary }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5">{children}</div>

        {pied && (
          <div
            className="sticky bottom-0 flex gap-3 bg-white px-5 sm:px-6 py-4"
            style={{ borderTop: `1px solid ${ST.divider}` }}
          >
            {pied}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── États vide / erreur ───────────────────────── */

/**
 * État d'erreur explicite. Avant, une requête en échec laissait les compteurs
 * à « 0 » : le vendeur lisait « 0 vente » au lieu de « je n'ai pas pu charger ».
 */
export function StErreur({
  titre = "Chargement impossible",
  message,
  onRetry,
}: {
  titre?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <StCard className="text-center py-10">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px]"
        style={{ background: ST.roseSoft, color: ST.roseText }}
      >
        <AlertTriangle size={22} />
      </div>
      <h3 className="mt-3 text-[15px] font-extrabold" style={{ color: ST.text }}>
        {titre}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-[12.5px] font-semibold" style={{ color: ST.textSecondary }}>
        {message ?? "La connexion au serveur a échoué. Vos données ne sont pas perdues : réessayez."}
      </p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <StButton variant="secondary" icon={RefreshCw} onClick={onRetry}>
            Réessayer
          </StButton>
        </div>
      )}
    </StCard>
  );
}

/** État vide : ce que c'est, à quoi ça sert, et une action pour démarrer. */
export function StVide({
  icon: Icon,
  titre,
  message,
  action,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  titre: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <StCard className="text-center py-12">
      <Icon size={42} style={{ color: "#d6e0da" }} className="mx-auto" />
      <h3 className="mt-3 text-[15px] font-extrabold" style={{ color: ST.text }}>
        {titre}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-[12.5px] font-semibold leading-relaxed" style={{ color: ST.textSecondary }}>
        {message}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </StCard>
  );
}

/* ───────────────────────── Fil d'Ariane ──────────────────────────────── */

/** Retour vers le hub Marketing — même gabarit sur toutes les sous-pages. */
export function StRetourMarketing({ libelle = "Marketing" }: { libelle?: string }) {
  return (
    <Link
      href="/vendeur/marketing"
      className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold hover:underline"
      style={{ color: ST.green }}
    >
      <ArrowLeft size={15} aria-hidden="true" /> {libelle}
    </Link>
  );
}
