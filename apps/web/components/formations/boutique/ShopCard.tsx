"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BookOpen, Check, Download, GraduationCap, Loader2, Package, PlayCircle, Repeat, ShoppingBag, ShoppingCart, Star,
} from "lucide-react";
import { trackEvents } from "@/lib/tracking/events";
import { KIND_LABEL, estGratuit, hrefItem, type ShopItem } from "./types";
import { nombre, note } from "./format";

const ICONE_KIND = { formation: GraduationCap, product: BookOpen, bundle: Package, subscription: Repeat } as const;
const ICONE_TAG = { formation: PlayCircle, product: Download, bundle: Package, subscription: Repeat } as const;
const COMPTE = {
  formation: ["apprenant", "apprenants"],
  product: ["vente", "ventes"],
  bundle: ["achat", "achats"],
  subscription: ["abonné", "abonnés"],
} as const;

/**
 * Carte du catalogue d'une boutique : double-bezel, vignette carrée jamais
 * rognée, prix tabulaire, Voir / Acheter / panier — même modèle que la carte
 * de la marketplace (explorer/CarteArticle), à l'accent du vendeur.
 */
export function ShopCard({
  item,
  fmtPrix,
  afficherVentes,
}: {
  item: ShopItem;
  fmtPrix: (fcfa: number) => string;
  afficherVentes: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [carting, setCarting] = useState(false);
  const [carted, setCarted] = useState(false);
  const href = hrefItem(item);
  const gratuit = estGratuit(item);
  // Le panier gère formations + produits (les packs et abonnements ont leur
  // propre flux d'achat).
  const canCart = (item.kind === "formation" || item.kind === "product") && !gratuit;
  const suivi = {
    id: item.id,
    kind: item.kind === "subscription" ? undefined : item.kind,
    price: item.price,
    title: item.title,
  };

  async function ajouterPanier(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (carting || carted || !canCart) return;
    setCarting(true);
    try {
      const body = item.kind === "formation" ? { formationId: item.id } : { productId: item.id };
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCarted(true);
        trackEvents.addToCart(suivi);
        window.dispatchEvent(new Event("nk:cart-change"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarting(false);
    }
  }

  function acheter(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    trackEvents.ctaClick(suivi, "boutique_card");
    // Pack et abonnement : la fiche porte son propre flux. Sinon : paiement
    // direct (contact + méthode + résumé sur une page), comme la marketplace.
    if (item.kind === "bundle" || item.kind === "subscription") {
      window.location.href = href;
      return;
    }
    trackEvents.addToCart(suivi);
    window.location.href = `/checkout?${item.kind === "formation" ? "fids" : "pids"}=${item.id}`;
  }

  const libelleAchat = gratuit
    ? item.kind === "formation" ? "Commencer" : "Télécharger"
    : item.kind === "subscription" ? "S'abonner"
    : item.kind === "bundle" ? "Voir le pack"
    : "Acheter";
  const IconeKind = ICONE_KIND[item.kind];
  const IconeTag = ICONE_TAG[item.kind];
  const avis = item.reviewsCount ?? 0;
  const aNote = item.rating > 0 && avis > 0;
  const aCompte = afficherVentes && item.count > 0;
  const [sing, plur] = COMPTE[item.kind];

  return (
    <article className="nkb-card nkb-reveal" data-testid="carte-boutique">
      <div className="nkb-card__core">
        <div className="nkb-card__media">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" loading="lazy" decoding="async" className="nkb-card__img" />
          ) : (
            <div className="nkb-card__ph" aria-hidden="true">
              <IconeKind strokeWidth={1.25} />
            </div>
          )}
          <span className="nkb-tag absolute left-3 top-3">
            <IconeTag strokeWidth={2} aria-hidden="true" />
            {KIND_LABEL[item.kind]}
          </span>
          {gratuit && <span className="nkb-tag nkb-tag--accent absolute right-3 top-3">Gratuit</span>}
          {item.kind === "bundle" && item.itemsCount && item.itemsCount > 0 ? (
            <span className="nkb-tag nkb-tag--ink absolute bottom-3 left-3">{item.itemsCount} articles inclus</span>
          ) : null}
          {item.kind === "subscription" && item.trialDays && item.trialDays > 0 ? (
            <span className="nkb-tag nkb-tag--ink absolute bottom-3 left-3">{item.trialDays} j d&apos;essai</span>
          ) : null}
        </div>

        <div className="nkb-card__body">
          <h3 className="nkb-card__title">{item.title}</h3>
          {item.kind === "subscription" && item.description && <p className="nkb-card__desc">{item.description}</p>}

          {/* Note et ventes — seulement quand elles existent : rien de vide sur un produit neuf. */}
          {(aNote || aCompte) && (
            <p className="nkb-note">
              {aNote && (
                <span className="inline-flex items-center gap-1">
                  <Star aria-hidden="true" />
                  <span className="nkb-sr">Note </span>
                  <strong>{note(item.rating)}</strong>
                  <span className="nkb-sr"> sur 5</span>
                  <span className="nkb-tabular">({nombre(avis)} avis)</span>
                </span>
              )}
              {aNote && aCompte && <span aria-hidden="true">·</span>}
              {aCompte && (
                <span className="nkb-tabular">
                  <strong>{nombre(item.count)}</strong> {item.count > 1 ? plur : sing}
                </span>
              )}
            </p>
          )}

          <div className="nkb-card__foot">
            <p className={`nkb-price${gratuit ? " nkb-price--free" : ""}`}>
              <span className="nkb-price__v">{gratuit ? "Gratuit" : fmtPrix(item.price)}</span>
              {item.kind === "subscription" && (
                <span className="nkb-price__unit">/ {item.interval === "yearly" ? "an" : "mois"}</span>
              )}
              {item.kind === "bundle" && item.originalPrice && item.originalPrice > item.price ? (
                <s>
                  <span className="nkb-sr">Prix initial </span>
                  {fmtPrix(item.originalPrice)}
                </s>
              ) : null}
            </p>

            <div className="nkb-card__actions">
              <Link href={href} className="nkb-stretch" aria-label={`Voir ${item.title}`}>
                <span className="nkb-btn nkb-btn--glass nkb-btn--sm">
                  Voir
                  <span className="nkb-btn__ico" aria-hidden="true">
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                </span>
              </Link>
              <button type="button" onClick={acheter} disabled={adding} className="nkb-btn nkb-btn--primary nkb-btn--sm nkb-z">
                {adding ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : gratuit ? (
                  <Download strokeWidth={2} aria-hidden="true" />
                ) : (
                  <ShoppingBag strokeWidth={2} aria-hidden="true" />
                )}
                {adding ? "Patientez…" : libelleAchat}
              </button>
              {canCart && (
                <button
                  type="button"
                  onClick={ajouterPanier}
                  disabled={carting}
                  aria-pressed={carted}
                  aria-label={carted ? "Dans le panier" : "Ajouter au panier"}
                  title={carted ? "Dans le panier" : "Ajouter au panier"}
                  className={`nkb-disc nkb-z${carted ? " is-on" : ""}`}
                >
                  {carting ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : carted ? (
                    <Check strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <ShoppingCart strokeWidth={1.9} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
