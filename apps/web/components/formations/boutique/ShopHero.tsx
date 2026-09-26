import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Facebook, Globe, Instagram, Linkedin, Mail, MessageCircle, Youtube } from "lucide-react";
import type { ShopOwner, ShopSocials } from "./types";
import { accroche, moisAnnee, nombre, note, pluriel } from "./format";

export interface ShopStats {
  produits: number;
  clients: number;
  /** Note moyenne pondérée par le nombre d'avis (0 sans avis). */
  note: number;
  avis: number;
}

type Reseau = { href: string; label: string; Icone: typeof Mail };

function urlExterne(valeur: string, base: string): string {
  const v = valeur.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `${base}${v.replace(/^@/, "").replace(/^\/+/, "")}`;
}

/** Réseaux et moyens de contact PUBLICS, dans l'ordre d'usage local (WhatsApp d'abord). */
export function reseauxPublics(s: ShopSocials | undefined): Reseau[] {
  if (!s) return [];
  const out: Reseau[] = [];
  const tel = (s.whatsapp ?? "").replace(/[^\d]/g, "");
  if (tel) out.push({ href: `https://wa.me/${tel}`, label: "WhatsApp", Icone: MessageCircle });
  if (s.email) out.push({ href: `mailto:${s.email.trim()}`, label: "E-mail", Icone: Mail });
  if (s.website) out.push({ href: urlExterne(s.website, "https://"), label: "Site web", Icone: Globe });
  if (s.instagram) out.push({ href: urlExterne(s.instagram, "https://instagram.com/"), label: "Instagram", Icone: Instagram });
  if (s.facebook) out.push({ href: urlExterne(s.facebook, "https://facebook.com/"), label: "Facebook", Icone: Facebook });
  if (s.youtube) out.push({ href: urlExterne(s.youtube, "https://youtube.com/"), label: "YouTube", Icone: Youtube });
  if (s.linkedin) out.push({ href: urlExterne(s.linkedin, "https://linkedin.com/in/"), label: "LinkedIn", Icone: Linkedin });
  return out;
}

/**
 * Hero de la vitrine : bannière en double-bezel (ratio 16/5 recommandé au
 * vendeur, hauteur plafonnée), logo à cheval, nom + badge, accroche, chiffres
 * en tabulaire, réseaux en pastilles, CTA principal.
 *
 * Les chiffres faibles ne sont pas mis en avant : les clients n'apparaissent
 * que si le vendeur l'a choisi (`afficherVentes`) et la note que s'il y a des
 * avis — une boutique qui débute n'affiche pas ses « 0 » sous son nom.
 */
export function ShopHero({
  owner,
  staticBase,
  stats,
  afficherVentes,
  verified,
  socials,
  memberSince,
  hasAny,
}: {
  owner: ShopOwner;
  staticBase: string;
  stats: ShopStats;
  afficherVentes: boolean;
  verified: boolean;
  socials?: ShopSocials;
  memberSince?: string | null;
  hasAny: boolean;
}) {
  const tagline = accroche(owner.bio);
  const depuis = moisAnnee(memberSince);
  const initiale = owner.name.trim().charAt(0).toUpperCase() || "N";

  const chiffres: Array<{ v: ReactNode; l: string }> = [];
  if (stats.produits > 0) chiffres.push({ v: nombre(stats.produits), l: stats.produits > 1 ? "Produits" : "Produit" });
  if (afficherVentes && stats.clients > 0) chiffres.push({ v: nombre(stats.clients), l: stats.clients > 1 ? "Clients" : "Client" });
  if (stats.avis > 0 && stats.note > 0) {
    chiffres.push({
      v: (
        <>
          {note(stats.note)}
          <small> / 5</small>
        </>
      ),
      l: pluriel(stats.avis, "avis", "avis"),
    });
  }
  if (depuis) chiffres.push({ v: depuis, l: "Membre depuis" });

  const reseaux = reseauxPublics(socials);

  return (
    <header className="nkb-hero">
      <div className="nkb-wrap">
        <div className={`nkb-bezel nkb-bezel--xl${owner.coverUrl ? " nkb-bezel--float" : ""}`}>
          {owner.coverUrl ? (
            <div className="nkb-hero__banner">
              <Image
                src={owner.coverUrl}
                alt={`Couverture de ${owner.name}`}
                fill
                priority
                unoptimized
                sizes="(min-width: 1208px) 1160px, 100vw"
                className="object-cover object-center"
              />
              <div className="nkb-hero__fade" aria-hidden="true" />
            </div>
          ) : (
            <div className="nkb-hero__banner nkb-hero__banner--fallback" aria-hidden="true" />
          )}
        </div>

        <div className="nkb-hero__id">
          <div className="nkb-hero__top">
            <div className="nkb-hero__who">
              <div className="nkb-hero__logo">
                {owner.image ? (
                  <Image src={owner.image} alt="" width={128} height={128} unoptimized />
                ) : (
                  <span className="nkb-hero__initial" aria-hidden="true">
                    {initiale}
                  </span>
                )}
              </div>
              <div className="nkb-hero__text">
                <div className="nkb-hero__title-row">
                  <h1 className="nkb-h1">{owner.name}</h1>
                  {verified && (
                    <span className="nkb-badge">
                      <BadgeCheck strokeWidth={2} aria-hidden="true" />
                      Vendeur vérifié
                    </span>
                  )}
                </div>
                <p className="nkb-hero__meta">
                  Propulsé par <a href="https://novakou.com">Novakou</a>
                  {owner.domain ? ` · ${owner.domain}` : ""}
                </p>
              </div>
            </div>

            {hasAny && (
              <div className="nkb-hero__cta">
                <a href="#catalogue" className="nkb-btn nkb-btn--primary nkb-btn--lg">
                  Voir les produits
                  <span className="nkb-btn__ico" aria-hidden="true">
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                </a>
                <a href={`${staticBase}/contact`} className="nkb-btn nkb-btn--glass nkb-btn--lg">
                  Nous contacter
                </a>
              </div>
            )}
          </div>

          {tagline && <p className="nkb-hero__tagline">{tagline}</p>}

          {(chiffres.length > 0 || reseaux.length > 0) && (
            <div className="nkb-hero__bottom">
              {chiffres.length > 0 && (
                <ul className="nkb-stats" aria-label="Chiffres de la boutique">
                  {chiffres.map((c) => (
                    <li key={c.l} className="nkb-stat">
                      <span className="nkb-stat__v">{c.v}</span>
                      <span className="nkb-stat__l">{c.l}</span>
                    </li>
                  ))}
                </ul>
              )}
              {reseaux.length > 0 && (
                <ul className="nkb-socials" aria-label="Réseaux et contact">
                  {reseaux.map(({ href, label, Icone }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="nkb-disc"
                        aria-label={label}
                        title={label}
                        target={href.startsWith("mailto:") ? undefined : "_blank"}
                        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      >
                        <Icone strokeWidth={1.6} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
