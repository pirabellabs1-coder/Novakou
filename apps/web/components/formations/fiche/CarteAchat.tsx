"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Facebook,
  Loader2,
  Share,
  ShoppingCart,
  Smartphone,
  Store,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import { usePrix } from "@/components/formations/Prix";

export interface ActionPrincipale {
  libelle: string;
  onClick: () => void;
  disabled?: boolean;
  chargement?: boolean;
  Icone?: LucideIcon;
}

export interface ActionPanier {
  onClick: () => void;
  etat: "repos" | "chargement" | "ajoute";
}

export interface Garantie {
  Icone: LucideIcon;
  contenu: ReactNode;
}

/**
 * Carte d'achat : prix en chiffres tabulaires (barré + remise), bouton
 * principal vert verre pleine largeur avec flèche dans un disque, « Ajouter
 * au panier » en verre clair, moyens de paiement, garanties, boutique et
 * partage. Collante à partir de `lg` (le parent pose `lg:sticky`).
 *
 * `children` reçoit ce que la page glisse entre les boutons et les garanties :
 * compte à rebours, formulaire de question, champs invité, écran de paiement.
 */
export function CarteAchat({
  id = "achat",
  etiquette,
  prix,
  prixInitial,
  gratuit,
  sousPrix,
  principal,
  panier,
  moyensPaiement = false,
  garanties,
  boutique,
  partage,
  children,
}: {
  id?: string;
  etiquette?: string;
  /** Montant en FCFA (devise de vérité) ; l'affichage suit le pays choisi. */
  prix: number;
  prixInitial?: number | null;
  gratuit?: boolean;
  sousPrix?: ReactNode;
  principal?: ActionPrincipale | null;
  panier?: ActionPanier | null;
  moyensPaiement?: boolean;
  garanties: Garantie[];
  boutique?: { nom: string; href: string } | null;
  /** Titre partagé ; absent = pas de bloc de partage. */
  partage?: string;
  children?: ReactNode;
}) {
  const formatPrix = usePrix();
  const estGratuit = gratuit ?? prix === 0;
  const remise = prixInitial && prixInitial > prix ? Math.round(((prixInitial - prix) / prixInitial) * 100) : 0;
  const IconePrincipal = principal?.Icone;

  return (
    <div id={id} className="nkf-bezel nkf-bezel--float scroll-mt-24">
      <div className="nkf-bezel__core p-5 sm:p-6">
        <p className="nkf-eyebrow">{etiquette ?? (estGratuit ? "Accès gratuit" : "Prix")}</p>
        <div className="nkf-price mt-3">
          {estGratuit ? (
            <span className="nkf-price__main nkf-price__main--free">Gratuit</span>
          ) : (
            <span className="nkf-price__main">{formatPrix(prix)}</span>
          )}
          {!estGratuit && remise > 0 && prixInitial && (
            // Prix barré et remise restent ensemble quand la ligne se replie.
            <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
              <s className="nkf-price__old">
                <span className="sr-only">Prix initial </span>
                {formatPrix(prixInitial)}
              </s>
              <span className="nkf-chip nkf-chip--green tabular-nums">−{remise} %</span>
            </span>
          )}
        </div>
        {sousPrix && <div className="mt-2 text-xs text-[#5c6b62]">{sousPrix}</div>}

        {principal && (
          <button
            type="button"
            onClick={principal.onClick}
            disabled={principal.disabled || principal.chargement}
            aria-busy={principal.chargement || undefined}
            className="nkf-btn nkf-btn--primary nkf-btn--block nkf-btn--lg mt-5"
          >
            <span className="nkf-btn__label">
              {principal.chargement ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : IconePrincipal ? (
                <IconePrincipal aria-hidden="true" />
              ) : null}
              {principal.libelle}
            </span>
            <span className="nkf-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </button>
        )}

        {panier && (
          <button
            type="button"
            onClick={panier.onClick}
            disabled={panier.etat !== "repos"}
            aria-pressed={panier.etat === "ajoute"}
            className={`nkf-btn nkf-btn--block mt-2.5 ${panier.etat === "ajoute" ? "is-on" : ""}`}
          >
            <span className="nkf-btn__label">
              {panier.etat === "chargement" ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : panier.etat === "ajoute" ? (
                <Check aria-hidden="true" />
              ) : (
                <ShoppingCart aria-hidden="true" />
              )}
              {panier.etat === "ajoute" ? "Ajouté au panier" : panier.etat === "chargement" ? "Ajout…" : "Ajouter au panier"}
            </span>
          </button>
        )}

        {children}

        {moyensPaiement && <PastillesPaiement />}

        {garanties.length > 0 && (
          <ul className="nkf-garanties mt-5 border-t border-[#e6ece8] pt-5">
            {garanties.map((g, i) => {
              const { Icone } = g;
              return (
                <li key={i}>
                  <Icone aria-hidden="true" />
                  <span>{g.contenu}</span>
                </li>
              );
            })}
          </ul>
        )}

        {boutique && (
          <Link href={boutique.href} className="nkf-shoplink mt-5">
            <span className="flex min-w-0 items-center gap-2">
              <Store className="text-[#006e2f]" aria-hidden="true" />
              <span className="truncate">Voir la boutique {boutique.nom}</span>
            </span>
            <ChevronRight className="nkf-shoplink__chev text-[#5c6b62]" aria-hidden="true" />
          </Link>
        )}

        {partage && (
          <div className="mt-5 border-t border-[#e6ece8] pt-4">
            <BoutonsPartage titre={partage} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Moyens de paiement : Mobile Money + carte, en petites pastilles ──── */
const MOBILE_MONEY = ["Orange Money", "MTN MoMo", "Moov Money", "Wave"];

export function PastillesPaiement() {
  return (
    <div className="mt-5 border-t border-[#e6ece8] pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5c6b62]">Moyens de paiement</p>
      <div className="nkf-pay mt-2.5">
        <span className="nkf-pay__pill nkf-pay__pill--strong">
          <Smartphone aria-hidden="true" />
          Mobile Money
        </span>
        {MOBILE_MONEY.map((m) => (
          <span key={m} className="nkf-pay__pill">
            {m}
          </span>
        ))}
        <span className="nkf-pay__pill nkf-pay__pill--strong">
          <CreditCard aria-hidden="true" />
          Carte bancaire
        </span>
      </div>
    </div>
  );
}

/* ── Partage : natif si disponible, WhatsApp, Facebook, X, copie du lien ── */
export function BoutonsPartage({ titre }: { titre: string }) {
  const [copie, setCopie] = useState(false);
  const [natif, setNatif] = useState(false);

  // navigator.share n'existe qu'au navigateur : décidé après le montage pour
  // que le rendu serveur et le premier rendu client soient identiques.
  useEffect(() => {
    setNatif(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // L'URL est lue au clic, telle quelle : un `?ref=` d'affilié présent sur la
  // page est conservé dans le lien partagé, la commission suit.
  const url = () => window.location.href;
  const ouvrir = (u: string) => window.open(u, "_blank", "noopener,noreferrer");

  async function copier() {
    try {
      await navigator.clipboard.writeText(url());
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible (contexte non sécurisé) : rien à signaler */
    }
  }

  async function partagerNatif() {
    try {
      await navigator.share({ title: titre, url: url() });
    } catch {
      /* annulé par l'utilisateur */
    }
  }

  return (
    <div className="nkf-share">
      <span className="mr-1 text-xs font-semibold text-[#5c6b62]">Partager</span>
      {natif && (
        <button type="button" onClick={partagerNatif} className="nkf-share__btn" aria-label="Partager…">
          <Share aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={() => ouvrir(`https://wa.me/?text=${encodeURIComponent(`${titre} ${url()}`)}`)}
        className="nkf-share__btn"
        aria-label="Partager sur WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3z" />
          <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => ouvrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}
        className="nkf-share__btn"
        aria-label="Partager sur Facebook"
      >
        <Facebook aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => ouvrir(`https://twitter.com/intent/tweet?text=${encodeURIComponent(titre)}&url=${encodeURIComponent(url())}`)}
        className="nkf-share__btn"
        aria-label="Partager sur X"
      >
        <Twitter aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={copier}
        className={`nkf-share__btn ${copie ? "is-on" : ""}`}
        aria-label={copie ? "Lien copié" : "Copier le lien"}
      >
        {copie ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copie ? "Lien copié dans le presse-papiers" : ""}
      </span>
    </div>
  );
}
