"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Flame,
  GraduationCap,
  Loader2,
  Package,
  PlayCircle,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import { usePrix } from "@/components/formations/Prix";
import { trackEvents } from "@/lib/tracking/events";
import { productImageSrc } from "@/lib/utils/image-url";
import { badgeArticle, hrefArticle, libelleType, remisePct, type Item } from "./types";

/** Vignette au ratio stable (le parent fixe `aspect-*`) : image ou motif de repli, plus les badges. */
export function VignetteArticle({
  item,
  className = "",
  tailleImg = 600,
}: {
  item: Item;
  className?: string;
  tailleImg?: number;
}) {
  const src = item.thumbnail ? (productImageSrc(item.thumbnail, tailleImg) ?? item.thumbnail) : null;
  const Icone = item.kind === "formation" ? GraduationCap : item.kind === "bundle" ? Package : BookOpen;
  const badge = badgeArticle(item);
  const remise = remisePct(item);

  return (
    <div className={`relative overflow-hidden bg-[#EEF3EF] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="nkx-card__img absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center bg-[radial-gradient(60%_60%_at_50%_40%,#DFEDE4,#F0F6F2)] text-[#006E2F]/60"
          aria-hidden="true"
        >
          <Icone size={48} strokeWidth={1.25} />
        </div>
      )}

      <span className="nkx-tag absolute left-3 top-3">
        {item.kind === "formation" ? (
          <PlayCircle size={11} strokeWidth={2} aria-hidden="true" />
        ) : item.kind === "bundle" ? (
          <Package size={11} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Download size={11} strokeWidth={2} aria-hidden="true" />
        )}
        {libelleType(item.type)}
      </span>
      {remise !== null && (
        <span className="nkx-tag nkx-tag--ink absolute right-3 top-3 tabular-nums">−{remise} %</span>
      )}
      {badge && (
        <span className={`nkx-tag absolute bottom-3 left-3 ${badge === "Bestseller" ? "nkx-tag--green" : ""}`}>
          {badge === "Bestseller" ? (
            <Flame size={11} strokeWidth={2} aria-hidden="true" />
          ) : badge === "Bien noté" ? (
            <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
          ) : (
            <Sparkles size={11} strokeWidth={2} aria-hidden="true" />
          )}
          {badge}
        </span>
      )}
    </div>
  );
}

/** Note et ventes — seulement quand elles existent (rien de vide sur un produit neuf). */
export function LigneNote({ item, className = "" }: { item: Item; className?: string }) {
  if (item.rating <= 0 && item.salesCount <= 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs text-[#5C6B62] ${className}`}>
      {item.rating > 0 && (
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="sr-only">Note </span>
          <span className="font-bold tabular-nums text-[#0E1512]">{item.rating.toFixed(1)}</span>
          <span className="sr-only"> sur 5</span>
          {item.reviewsCount > 0 && <span className="tabular-nums">({item.reviewsCount} avis)</span>}
        </span>
      )}
      {item.rating > 0 && item.salesCount > 0 && (
        <span aria-hidden="true" className="text-[#C9D3CD]">
          ·
        </span>
      )}
      {item.salesCount > 0 && (
        <span className="tabular-nums">
          <span className="font-semibold text-[#0E1512]">{item.salesCount}</span>{" "}
          {item.kind === "formation" ? "élève" : "vente"}
          {item.salesCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

/** Prix en chiffres tabulaires, prix barré à côté si remise. */
export function PrixArticle({ item, taille = "base" }: { item: Item; taille?: "sm" | "base" | "lg" }) {
  const formatPrix = usePrix();
  const remise = remisePct(item);
  const classe = taille === "lg" ? "text-2xl md:text-[1.75rem]" : taille === "sm" ? "text-base" : "text-xl";
  if (item.price === 0) {
    return <span className={`${classe} font-extrabold tracking-tight text-[#006E2F]`}>Gratuit</span>;
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className={`${classe} font-extrabold tabular-nums tracking-tight text-[#0E1512]`}>{formatPrix(item.price)}</span>
      {remise !== null && item.originalPrice && (
        <s className="text-xs font-medium tabular-nums text-[#5C6B62]">
          <span className="sr-only">Prix initial </span>
          {formatPrix(item.originalPrice)}
        </s>
      )}
    </span>
  );
}

/** Carte de la grille : double-bezel, vignette 4:3, prix, Voir / Acheter / panier. */
export function CarteArticle({ item }: { item: Item }) {
  const [adding, setAdding] = useState(false);
  const [carting, setCarting] = useState(false);
  const [carted, setCarted] = useState(false);
  const href = hrefArticle(item);

  // Le panier gère formations + produits digitaux (pas les packs, qui ont leur
  // propre flux d'achat).
  const canAddToCart = item.kind === "formation" || item.kind === "product";

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (carting || carted || !canAddToCart) return;
    setCarting(true);
    try {
      const body = item.kind === "formation" ? { formationId: item.id } : { productId: item.id };
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Reste coloré : l'article est dans le panier, on garde l'état « ajouté ».
        setCarted(true);
        trackEvents.addToCart({ id: item.id, kind: item.kind, price: item.price, title: item.title });
        window.dispatchEvent(new Event("nk:cart-change"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarting(false);
    }
  }

  async function handleBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      // Tracking : clic CTA + add_to_cart (l'acheteur saute le panier).
      trackEvents.ctaClick({ id: item.id, kind: item.kind, price: item.price, title: item.title }, "explorer_card");
      trackEvents.addToCart({ id: item.id, kind: item.kind, price: item.price, title: item.title });
      // Pack : la fiche du pack porte son propre flux d'achat. Sinon : checkout
      // direct (contact + méthode + résumé sur une page) avec fids/pids.
      if (item.kind === "bundle") {
        window.location.href = `/bundle/${item.slug}`;
        return;
      }
      const qs = item.kind === "formation" ? `fids=${item.id}` : `pids=${item.id}`;
      window.location.href = `/checkout?${qs}`;
    } catch (err) {
      console.error(err);
      setAdding(false);
    }
  }

  const libelleAchat = item.price === 0 ? (item.kind === "formation" ? "Commencer" : "Télécharger") : "Acheter";

  return (
    <article className="nkx-card nkx-reveal group flex h-full flex-col" data-testid="carte-article">
      <div className="nkx-card__core flex h-full flex-col">
        <VignetteArticle item={item} className="aspect-[4/3]" />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {item.category && (
            <p className="mb-1.5 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#006E2F]">{item.category}</p>
          )}
          <h3 className="mb-2 line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-snug tracking-tight text-[#0E1512] transition-colors duration-300 group-hover:text-[#006E2F]">
            {item.title}
          </h3>
          <LigneNote item={item} className="mb-3" />

          <div className="mt-auto flex flex-col gap-3 border-t border-[#E6ECE8] pt-4">
            <PrixArticle item={item} />
            <div className="flex items-center gap-2">
              <Link href={href} className="nkx-stretch min-w-0 flex-1" aria-label={`Voir ${item.title}`}>
                <span className="nkx-btn nkx-btn--sm w-full">
                  Voir
                  <span className="nkx-btn__ico" aria-hidden="true">
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleBuy}
                disabled={adding}
                className="nkx-btn nkx-btn--sm nkx-btn--primary relative z-[1] min-w-0 flex-1"
              >
                {adding ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : item.price === 0 ? (
                  <Download size={15} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <ShoppingBag size={15} strokeWidth={2} aria-hidden="true" />
                )}
                {adding ? "Patientez…" : libelleAchat}
              </button>
              {canAddToCart && item.price > 0 && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={carting}
                  aria-pressed={carted}
                  aria-label={carted ? "Dans le panier" : "Ajouter au panier"}
                  title={carted ? "Dans le panier" : "Ajouter au panier"}
                  className={`nkx-disc relative z-[1] ${carted ? "is-on" : ""}`}
                >
                  {carting ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : carted ? (
                    <Check size={16} strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <ShoppingCart size={16} strokeWidth={1.9} aria-hidden="true" />
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

/** Squelette au gabarit exact de la carte : aucun saut quand le contenu arrive. */
export function CarteArticleSquelette() {
  return (
    <div className="nkx-card flex h-full flex-col" aria-hidden="true">
      <div className="nkx-card__core flex h-full flex-col">
        <div className="nkx-skel aspect-[4/3] !rounded-none" />
        <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
          <div className="nkx-skel h-2.5 w-1/3" />
          <div className="nkx-skel h-4 w-11/12" />
          <div className="nkx-skel h-4 w-2/3" />
          <div className="nkx-skel h-3 w-1/2" />
          <div className="mt-auto flex flex-col gap-3 border-t border-[#E6ECE8] pt-4">
            <div className="nkx-skel h-6 w-1/2" />
            <div className="flex gap-2">
              <div className="nkx-skel h-[38px] flex-1 !rounded-full" />
              <div className="nkx-skel h-[38px] flex-1 !rounded-full" />
              <div className="nkx-skel h-10 w-10 !rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
