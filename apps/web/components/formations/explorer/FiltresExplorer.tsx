"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  GraduationCap,
  LayoutGrid,
  Package,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePrix } from "@/components/formations/Prix";
import { mouvementReduit } from "./reveal";
import { PRIX_MAX_DEFAUT, type ExplorerData, type Onglet, type Tri } from "./types";

type Props = {
  onglet: Onglet;
  onOnglet: (o: Onglet) => void;
  stats: ExplorerData["stats"] | undefined;
  tri: Tri;
  onTri: (t: Tri) => void;
  noteMin: number;
  onNoteMin: (n: number) => void;
  prixMax: number;
  onPrixMax: (p: number) => void;
  /** Filtres pilotés depuis ce panneau (type, tri, note, prix) — badge du bouton mobile. */
  nbFiltresPanneau: number;
  /** Au moins un filtre actif, recherche et catégorie comprises — affiche « Réinitialiser ». */
  filtresActifs: boolean;
  onReinitialiser: () => void;
  nbResultats: number;
  page: number;
  totalPages: number;
  /** Premier chargement : le compteur ne prétend pas « 0 résultat ». */
  chargement: boolean;
};

const ONGLETS: { valeur: Onglet; libelle: string; icone: LucideIcon; cle: keyof ExplorerData["stats"] }[] = [
  { valeur: "all", libelle: "Tout", icone: LayoutGrid, cle: "total" },
  { valeur: "formations", libelle: "Formations", icone: GraduationCap, cle: "totalFormations" },
  { valeur: "products", libelle: "Produits", icone: ShoppingBag, cle: "totalProducts" },
  { valeur: "bundles", libelle: "Packs", icone: Package, cle: "totalBundles" },
];
const NOTES = [
  { valeur: 0, libelle: "Toutes notes" },
  { valeur: 4, libelle: "4,0 et +" },
  { valeur: 4.5, libelle: "4,5 et +" },
];
const TRIS: { valeur: Tri; libelle: string }[] = [
  { valeur: "relevance", libelle: "Pertinence" },
  { valeur: "recent", libelle: "Plus récents" },
  { valeur: "price-asc", libelle: "Prix croissant" },
  { valeur: "price-desc", libelle: "Prix décroissant" },
  { valeur: "rating", libelle: "Mieux notés" },
];
const PRIX_MIN = 5_000;
const PRIX_PAS = 5_000;

/**
 * Filtres et tri de la marketplace. Bureau : barre collante en verre sous la
 * navigation. Mobile : bouton « Filtres » qui ouvre un tiroir plein écran.
 */
export function FiltresExplorer(props: Props) {
  const [ouvert, setOuvert] = useState(false);
  const declencheurRef = useRef<HTMLButtonElement>(null);
  const fermer = useCallback(() => {
    setOuvert(false);
    declencheurRef.current?.focus();
  }, []);

  return (
    <div data-testid="filters" className="nkx-toolbar sticky top-16 z-30">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        {/* Bureau */}
        <div className="hidden min-h-[64px] flex-wrap items-center gap-3 py-3 md:flex">
          <BarreControles {...props} />
          <div className="ml-auto flex items-center gap-3">
            {props.filtresActifs && (
              <button type="button" onClick={props.onReinitialiser} className="nkx-btn nkx-btn--sm">
                <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                Réinitialiser
              </button>
            )}
            <Compteur nb={props.nbResultats} page={props.page} totalPages={props.totalPages} chargement={props.chargement} />
          </div>
        </div>
        {/* Mobile */}
        <div className="flex min-h-[60px] items-center justify-between gap-3 py-2.5 md:hidden">
          <button
            ref={declencheurRef}
            type="button"
            onClick={() => setOuvert(true)}
            aria-haspopup="dialog"
            aria-expanded={ouvert}
            className="nkx-btn nkx-btn--sm"
          >
            <SlidersHorizontal size={15} strokeWidth={1.75} aria-hidden="true" />
            Filtres
            {props.nbFiltresPanneau > 0 && (
              <span className="nkx-seg__n !bg-[#006E2F] !text-white">
                {props.nbFiltresPanneau}
                <span className="sr-only"> actifs</span>
              </span>
            )}
          </button>
          <Compteur nb={props.nbResultats} page={props.page} totalPages={props.totalPages} chargement={props.chargement} />
        </div>
      </div>
      {ouvert && <TiroirFiltres {...props} onFermer={fermer} />}
    </div>
  );
}

function Compteur({ nb, page, totalPages, chargement }: { nb: number; page: number; totalPages: number; chargement: boolean }) {
  if (chargement) {
    return (
      <p aria-live="polite" className="whitespace-nowrap text-xs text-[#5C6B62]">
        Chargement…
      </p>
    );
  }
  return (
    <p aria-live="polite" className="whitespace-nowrap text-xs text-[#5C6B62] tabular-nums">
      <span className="font-extrabold text-[#0E1512]">{nb.toLocaleString("fr-FR")}</span> résultat{nb > 1 ? "s" : ""}
      {totalPages > 1 && (
        <>
          {" "}
          · page <span className="font-extrabold text-[#0E1512]">{page}</span> / {totalPages}
        </>
      )}
    </p>
  );
}

/** Contrôles de la barre bureau : segments, tri, note, prix. */
function BarreControles({ onglet, onOnglet, stats, tri, onTri, noteMin, onNoteMin, prixMax, onPrixMax }: Props) {
  const formatPrix = usePrix();
  const idTri = useId();
  const idPrix = useId();
  return (
    <>
      <div role="group" aria-label="Type de contenu" className="nkx-seg">
        {ONGLETS.map((o) => {
          const Icone = o.icone;
          const actif = onglet === o.valeur;
          return (
            <button key={o.valeur} type="button" aria-pressed={actif} onClick={() => onOnglet(o.valeur)} className="nkx-seg__btn">
              <Icone size={14} strokeWidth={1.75} aria-hidden="true" className={actif ? "text-[#006E2F]" : ""} />
              {o.libelle}
              <span className="nkx-seg__n">{stats?.[o.cle] ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <label htmlFor={idTri} className="sr-only">
          Trier par
        </label>
        <ArrowDownUp
          size={14}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C6B62]"
          aria-hidden="true"
        />
        <select id={idTri} value={tri} onChange={(e) => onTri(e.target.value as Tri)} className="nkx-select">
          {TRIS.map((t) => (
            <option key={t.valeur} value={t.valeur}>
              {t.libelle}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B62]"
          aria-hidden="true"
        />
      </div>

      <div role="group" aria-label="Note minimale" className="nkx-seg">
        {NOTES.map((n) => (
          <button key={n.valeur} type="button" aria-pressed={noteMin === n.valeur} onClick={() => onNoteMin(n.valeur)} className="nkx-seg__btn">
            {n.valeur > 0 && <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden="true" />}
            {n.libelle}
          </button>
        ))}
      </div>

      <div className="nkx-prix">
        <Wallet size={14} strokeWidth={1.75} className="text-[#5C6B62]" aria-hidden="true" />
        <label htmlFor={idPrix} className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5C6B62]">
          Prix max
        </label>
        <input
          id={idPrix}
          type="range"
          min={PRIX_MIN}
          max={PRIX_MAX_DEFAUT}
          step={PRIX_PAS}
          value={prixMax}
          onChange={(e) => onPrixMax(Number(e.target.value))}
          aria-valuetext={prixMax >= PRIX_MAX_DEFAUT ? "Sans limite" : formatPrix(prixMax)}
          className="nkx-range w-24"
        />
        <output htmlFor={idPrix} className="min-w-[36px] text-right text-xs font-extrabold text-[#006E2F] tabular-nums">
          {prixMax >= PRIX_MAX_DEFAUT ? "∞" : `${Math.round(prixMax / 1000)}k`}
        </output>
      </div>
    </>
  );
}

/**
 * Tiroir plein écran (mobile). Rendu dans <body> : la barre collante est
 * floutée (backdrop-filter), ce qui ferait d'elle le repère d'un `fixed`.
 * Focus posé sur « Fermer », piégé dans le panneau, restitué au déclencheur ;
 * Échap ferme ; le fond ne défile plus. Sortie courte (200 ms), immédiate en
 * mouvement réduit.
 */
function TiroirFiltres({ onFermer, ...p }: Props & { onFermer: () => void }) {
  const panneauRef = useRef<HTMLDivElement>(null);
  const [sortie, setSortie] = useState(false);
  const idTitre = useId();
  const idPrix = useId();
  const formatPrix = usePrix();

  const fermer = useCallback(() => {
    if (mouvementReduit()) {
      onFermer();
      return;
    }
    setSortie(true);
    window.setTimeout(onFermer, 200);
  }, [onFermer]);

  useEffect(() => {
    const panneau = panneauRef.current;
    if (!panneau) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panneau.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fermer();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panneau.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = precedent;
    };
  }, [fermer]);

  const chip = (cle: string | number, actif: boolean, onClick: () => void, contenu: ReactNode) => (
    <button key={cle} type="button" aria-pressed={actif} onClick={onClick} className="nkx-chip !max-w-none justify-center">
      <span>{contenu}</span>
    </button>
  );
  const legende = "mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C6B62]";

  return createPortal(
    <div className={`nkx-drawer fixed inset-0 z-[60] ${sortie ? "is-out" : ""}`}>
      <div className="absolute inset-0 bg-[#0E1512]/40 backdrop-blur-sm" onClick={fermer} aria-hidden="true" />
      <div
        ref={panneauRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        className="nkx-drawer__panel absolute inset-0 flex flex-col bg-[#f7f9fb]"
      >
        <div className="flex items-center justify-between border-b border-[#E6ECE8] bg-white px-4 py-3">
          <h2 id={idTitre} className="text-base font-extrabold text-[#0E1512]">
            Filtres
          </h2>
          <button type="button" data-autofocus onClick={fermer} aria-label="Fermer les filtres" className="nkx-disc">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
          <fieldset>
            <legend className={legende}>Type de contenu</legend>
            <div className="grid grid-cols-2 gap-2">
              {ONGLETS.map((o) =>
                chip(
                  o.valeur,
                  p.onglet === o.valeur,
                  () => p.onOnglet(o.valeur),
                  <>
                    {o.libelle} <span className="tabular-nums opacity-70">({p.stats?.[o.cle] ?? 0})</span>
                  </>,
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legende}>Trier par</legend>
            <div className="flex flex-wrap gap-2">
              {TRIS.map((t) => chip(t.valeur, p.tri === t.valeur, () => p.onTri(t.valeur), t.libelle))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legende}>Note minimale</legend>
            <div className="flex flex-wrap gap-2">
              {NOTES.map((n) =>
                chip(
                  n.valeur,
                  p.noteMin === n.valeur,
                  () => p.onNoteMin(n.valeur),
                  <>
                    {n.valeur > 0 && <Star size={12} className="mr-1 inline-block fill-amber-400 text-amber-400" aria-hidden="true" />}
                    {n.libelle}
                  </>,
                ),
              )}
            </div>
          </fieldset>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor={idPrix} className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C6B62]">
                Prix maximum
              </label>
              <output htmlFor={idPrix} className="text-sm font-extrabold text-[#006E2F] tabular-nums">
                {p.prixMax >= PRIX_MAX_DEFAUT ? "Sans limite" : formatPrix(p.prixMax)}
              </output>
            </div>
            <input
              id={idPrix}
              type="range"
              min={PRIX_MIN}
              max={PRIX_MAX_DEFAUT}
              step={PRIX_PAS}
              value={p.prixMax}
              onChange={(e) => p.onPrixMax(Number(e.target.value))}
              aria-valuetext={p.prixMax >= PRIX_MAX_DEFAUT ? "Sans limite" : formatPrix(p.prixMax)}
              className="nkx-range w-full"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#E6ECE8] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <button type="button" onClick={p.onReinitialiser} disabled={!p.filtresActifs} className="nkx-btn flex-1">
            <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
            Effacer
          </button>
          <button type="button" onClick={fermer} className="nkx-btn nkx-btn--primary flex-1">
            <span className="tabular-nums">
              Voir {p.nbResultats.toLocaleString("fr-FR")} résultat{p.nbResultats > 1 ? "s" : ""}
            </span>
            <span className="nkx-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
