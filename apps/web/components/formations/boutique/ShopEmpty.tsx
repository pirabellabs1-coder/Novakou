"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, PlayCircle, SearchX, Share2, Store, Users } from "lucide-react";

/** Boutique sans aucun produit publié : « en construction », sans blanc vide. */
export function ShopEmpty({ shopName }: { shopName: string }) {
  function partager() {
    const url = window.location.href;
    const nav = window.navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === "function") {
      nav.share({ title: shopName, url }).catch(() => null);
    } else if (nav.clipboard?.writeText) {
      nav.clipboard.writeText(url).catch(() => null);
    }
  }

  return (
    <div className="nkb-bezel nkb-bezel--xl nkb-bezel--float nkb-empty">
      <div className="nkb-empty__core">
        <div className="nkb-empty__ico" aria-hidden="true">
          <Store strokeWidth={1.5} />
        </div>
        <span className="nkb-eyebrow">Bientôt en ligne</span>
        <h2 className="mt-3">Boutique en construction</h2>
        <p>
          {shopName} prépare ses premiers contenus avec soin. Revenez très bientôt pour découvrir formations, ebooks et
          coaching de qualité.
        </p>
        <ul className="nkb-pills" aria-label="Ce que vous trouverez ici">
          {[
            { Icone: PlayCircle, label: "Formations vidéo" },
            { Icone: BookOpen, label: "Ebooks & guides" },
            { Icone: MessageCircle, label: "Coaching 1-1" },
            { Icone: Users, label: "Communauté" },
          ].map(({ Icone, label }) => (
            <li key={label} className="nkb-pill">
              <Icone strokeWidth={1.6} aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <div className="nkb-empty__cta">
          <Link href="/explorer" className="nkb-btn nkb-btn--primary nkb-btn--lg">
            Explorer Novakou
            <span className="nkb-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </Link>
          <button type="button" onClick={partager} className="nkb-btn nkb-btn--glass nkb-btn--lg">
            <Share2 strokeWidth={1.75} aria-hidden="true" />
            Partager la boutique
          </button>
        </div>
        <p className="!mt-6 text-xs">
          Vous voulez être averti à l&apos;ouverture ? Suivez {shopName} sur ses réseaux ou revenez dans quelques jours.
        </p>
      </div>
    </div>
  );
}

/** Filtre ou recherche sans résultat. */
export function ShopNoResults({ query, filtre, onReset }: { query: string; filtre: string; onReset: () => void }) {
  return (
    <div className="nkb-bezel nkb-empty" role="status">
      <div className="nkb-empty__core">
        <div className="nkb-empty__ico" aria-hidden="true">
          <SearchX strokeWidth={1.5} />
        </div>
        <h2>{query ? "Aucun résultat" : `Aucun produit dans cette catégorie`}</h2>
        <p>
          {query ? (
            <>
              Rien ne correspond à « <strong>{query}</strong> »{filtre ? ` dans ${filtre}` : ""}. Essayez un autre terme ou
              retirez le filtre actif.
            </>
          ) : (
            <>Cette boutique n&apos;a rien publié ici pour le moment. Le reste du catalogue vous attend.</>
          )}
        </p>
        <div className="nkb-empty__cta">
          <button type="button" onClick={onReset} className="nkb-btn nkb-btn--glass">
            Tout afficher
            <span className="nkb-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
