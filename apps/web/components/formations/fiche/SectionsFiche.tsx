"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { ArrowLeft, BadgeCheck, Check, ChevronDown, MessageSquare, Star, type LucideIcon } from "lucide-react";
import { avatarSrc } from "@/lib/utils/image-url";

// Briques communes aux trois fiches (produit, formation, pack) : section en
// double-bezel, accordéon accessible, liste à coches, avis, FAQ, états de
// chargement et d'erreur. Styles dans fiche.css (préfixe nkf-).

/* ── Aides ─────────────────────────────────────────────────────────────── */
export const formaterNombre = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export function initiales(nom: string | null | undefined) {
  if (!nom) return "?";
  return nom.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function ilYA(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 30) return `Il y a ${d} j`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  const ans = Math.floor(d / 365);
  return `Il y a ${ans} an${ans > 1 ? "s" : ""}`;
}

/* ── Section : coque double-bezel, titre h2, méta optionnelle ─────────── */
export function SectionFiche({
  id,
  titre,
  eyebrow,
  meta,
  actions,
  children,
  className = "",
}: {
  id?: string;
  titre: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const auto = useId();
  const titreId = id ? `${id}-titre` : `nkf-section-${auto}`;
  return (
    <section id={id} aria-labelledby={titreId} className={`nkf-bezel nkf-reveal scroll-mt-28 ${className}`}>
      <div className="nkf-bezel__core p-5 sm:p-7 md:p-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {eyebrow && <p className="nkf-eyebrow mb-2">{eyebrow}</p>}
            <h2 id={titreId} className="nkf-h2">
              {titre}
            </h2>
          </div>
          {meta && <p className="text-xs tabular-nums text-[#5c6b62]">{meta}</p>}
          {actions}
        </header>
        {children}
      </div>
    </section>
  );
}

/* ── Accordéon : button[aria-expanded] + région, hauteur en grid-rows ──── */
export function Accordeon({
  titre,
  meta,
  num,
  ouvert,
  onChange,
  defautOuvert = false,
  niveau = 3,
  children,
}: {
  titre: ReactNode;
  meta?: ReactNode;
  /** Numéro affiché à gauche (programme d'une formation). */
  num?: number;
  /** Contrôlé si fourni ; sinon état interne. */
  ouvert?: boolean;
  onChange?: (ouvert: boolean) => void;
  defautOuvert?: boolean;
  /** Niveau du titre qui enveloppe le bouton (h3 sous une section h2). */
  niveau?: 3 | 4;
  children: ReactNode;
}) {
  const [interne, setInterne] = useState(defautOuvert);
  const estOuvert = ouvert ?? interne;
  const uid = useId();
  const panelId = `nkf-acc-${uid}`;
  const btnId = `${panelId}-btn`;
  const Titre = niveau === 4 ? "h4" : "h3";

  function basculer() {
    const suivant = !estOuvert;
    onChange?.(suivant);
    if (ouvert === undefined) setInterne(suivant);
  }

  return (
    <div className="nkf-acc" data-open={estOuvert ? "true" : "false"}>
      <Titre className="m-0">
        <button type="button" id={btnId} className="nkf-acc__btn" aria-expanded={estOuvert} aria-controls={panelId} onClick={basculer}>
          {num !== undefined && (
            <span className="nkf-acc__num" aria-hidden="true">
              {num}
            </span>
          )}
          <span className="nkf-acc__title">{titre}</span>
          {meta && <span className="nkf-acc__meta">{meta}</span>}
          <ChevronDown className="nkf-acc__chev" aria-hidden="true" />
        </button>
      </Titre>
      <div id={panelId} role="region" aria-labelledby={btnId} className="nkf-acc__panel">
        <div className="nkf-acc__inner">
          <div className="nkf-acc__body">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Note en étoiles (lecture seule) ──────────────────────────────────── */
export function EtoilesNote({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${note.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={taille}
          className={s <= Math.round(note) ? "fill-amber-400 text-amber-400" : "text-[#d5ddd8]"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/* ── Liste à coches (apprentissages, prérequis, « ce que vous obtenez ») ─ */
export function ListeCoches({
  items,
  colonnes = 1,
  Icone = Check,
}: {
  items: ReactNode[];
  colonnes?: 1 | 2;
  Icone?: LucideIcon;
}) {
  return (
    <ul className={`nkf-check ${colonnes === 2 ? "nkf-check--2" : ""}`}>
      {items.map((it, i) => (
        <li key={i}>
          <span className="nkf-check__ico" aria-hidden="true">
            <Icone strokeWidth={2.5} />
          </span>
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── FAQ : accordéons, premier ouvert ─────────────────────────────────── */
export interface QuestionFaq {
  q: string;
  r: ReactNode;
}

export function FaqFiche({ items }: { items: QuestionFaq[] }) {
  return (
    <div className="grid gap-2.5">
      {items.map((it, i) => (
        <Accordeon key={it.q} titre={it.q} defautOuvert={i === 0}>
          <div className="text-sm leading-relaxed text-[#2f3a34] [&_a]:font-semibold [&_a]:text-[#006e2f] [&_a]:underline [&_a]:underline-offset-2">
            {it.r}
          </div>
        </Accordeon>
      ))}
    </div>
  );
}

/* ── Avis : liste détaillée (avec réponse du créateur si présente) ─────── */
export interface AvisFiche {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
  response?: string | null;
  respondedAt?: string | null;
}

export function ListeAvis({ avis, vide, sousVide }: { avis: AvisFiche[]; vide: string; sousVide?: string }) {
  if (avis.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f7f9fb] px-6 py-10 text-center">
        <MessageSquare size={36} strokeWidth={1.25} className="mx-auto text-[#b7c2bb]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[#0e1512]">{vide}</p>
        {sousVide && <p className="mt-1 text-xs text-[#5c6b62]">{sousVide}</p>}
      </div>
    );
  }
  return (
    <ul className="m-0 grid list-none p-0">
      {avis.map((r) => (
        <li key={r.id} className="border-b border-[#e6ece8] py-5 first:pt-0 last:border-0 last:pb-0">
          <article className="flex items-start gap-3">
            <span className="nkf-author__avatar" aria-hidden="true">
              {r.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc(r.user.image, 64) ?? r.user.image} alt="" loading="lazy" decoding="async" />
              ) : (
                initiales(r.user.name)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-bold text-[#0e1512]">{r.user.name ?? "Acheteur"}</p>
                <span className="text-[11px] text-[#5c6b62]">{ilYA(r.createdAt)}</span>
              </div>
              <EtoilesNote note={r.rating} taille={13} />
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#2f3a34]">{r.comment}</p>
              {r.response && (
                <div className="mt-3 rounded-r-xl border-l-2 border-[#006e2f]/40 bg-[#f0f6f2] py-2.5 pl-4 pr-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#006e2f]">
                    <BadgeCheck size={14} aria-hidden="true" />
                    Réponse du créateur
                    {r.respondedAt && <span className="font-medium normal-case tracking-normal text-[#5c6b62]">· {ilYA(r.respondedAt)}</span>}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0e1512]">{r.response}</p>
                </div>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/* ── États : squelette au gabarit de la fiche, article introuvable ─────── */
export function EtatChargementFiche() {
  return (
    <div className="nkf min-h-screen bg-[#f7f9fb]" aria-busy="true" aria-label="Chargement de la fiche">
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
        <div className="nkf-skel h-8 w-28 !rounded-full" />
        <div className="nkf-skel mt-9 h-3 w-24" />
        <div className="nkf-skel mt-4 h-10 w-3/4 max-w-2xl" />
        <div className="nkf-skel mt-3 h-5 w-1/2 max-w-md" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-10">
          <div className="nkf-skel aspect-video !rounded-[22px]" />
          <div className="nkf-skel h-[420px] !rounded-[22px]" />
          <div className="nkf-skel h-64 !rounded-[22px]" />
        </div>
      </div>
    </div>
  );
}

export function EtatIntrouvable({ Icone, titre, texte }: { Icone: LucideIcon; titre: string; texte: string }) {
  return (
    <div className="nkf flex min-h-screen items-center justify-center bg-[#f7f9fb] px-6">
      <div className="nkf-bezel w-full max-w-md">
        <div className="nkf-bezel__core p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f0f6f2] text-[#006e2f]" aria-hidden="true">
            <Icone size={30} strokeWidth={1.4} />
          </span>
          <h1 className="nkf-h2 mt-5">{titre}</h1>
          <p className="mt-2 text-sm text-[#5c6b62]">{texte}</p>
          <Link href="/explorer" className="nkf-btn nkf-btn--primary mt-6">
            <span className="nkf-btn__label">
              <ArrowLeft aria-hidden="true" />
              Voir le catalogue
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
