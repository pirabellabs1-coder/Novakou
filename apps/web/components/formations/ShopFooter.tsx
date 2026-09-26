import Image from "next/image";
import { SHOP_STATIC_PAGES, type ShopStaticSlug } from "@/lib/formations/shop-static";
import { accentVars } from "./boutique/accent";
import { accroche } from "./boutique/format";
import { reseauxPublics } from "./boutique/ShopHero";
import type { ShopSocials } from "./boutique/types";
import "./boutique/boutique.css";

/**
 * Pied de page d'une BOUTIQUE, réutilisé au bas des pages produit/formation
 * qui appartiennent à cette boutique (l'identité, c'est la boutique) : nom,
 * liens des pages auto-générées, réseaux, mention « Propulsé par Novakou ».
 *
 * `base` remplace `/${shopSlug}` sur un domaine personnalisé (liens à la
 * racine) ; les autres props sont optionnelles pour ne rien changer aux
 * appelants existants.
 */
export default function ShopFooter({
  shopSlug,
  shopName,
  legalName,
  base,
  themeColor,
  logoUrl,
  domain,
  socials,
  description,
}: {
  shopSlug: string;
  shopName: string;
  legalName?: string | null;
  /** Préfixe des liens boutique : "" sur domaine perso ; défaut `/${shopSlug}`. */
  base?: string;
  themeColor?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
  socials?: ShopSocials;
  description?: string | null;
}) {
  const prefixe = base ?? `/${shopSlug}`;
  const pages = Object.keys(SHOP_STATIC_PAGES) as ShopStaticSlug[];
  const boutiqueLinks = pages.filter((s) => SHOP_STATIC_PAGES[s].footerGroup === "boutique");
  const legalLinks = pages.filter((s) => SHOP_STATIC_PAGES[s].footerGroup === "legales");
  const reseaux = reseauxPublics(socials);
  const resume = accroche(description, 140);

  return (
    <footer className="nkb nkb-foot" style={accentVars(themeColor)}>
      <div className="nkb-foot__inner">
        <div className="nkb-foot__grid">
          <div className="nkb-foot__brandcol">
            <a href={prefixe || "/"} className="nkb-foot__brand">
              {logoUrl ? (
                <span className="nkb-nav__mark">
                  <Image src={logoUrl} alt="" width={36} height={36} unoptimized />
                </span>
              ) : (
                <span className="nkb-nav__mark nkb-nav__mark--initial" aria-hidden="true">
                  {shopName.trim().charAt(0).toUpperCase() || "N"}
                </span>
              )}
              {shopName}
            </a>
            {resume && <p className="nkb-foot__desc">{resume}</p>}
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

          <nav aria-label="Pages de la boutique">
            <p className="nkb-foot__title">Boutique</p>
            <ul className="nkb-foot__list">
              {boutiqueLinks.map((s) => (
                <li key={s}>
                  <a href={`${prefixe}/${s}`} className="nkb-foot__link">
                    {SHOP_STATIC_PAGES[s].title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Pages légales">
            <p className="nkb-foot__title">Légales</p>
            <ul className="nkb-foot__list">
              {legalLinks.map((s) => (
                <li key={s}>
                  <a href={`${prefixe}/${s}`} className="nkb-foot__link">
                    {SHOP_STATIC_PAGES[s].title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="nkb-foot__bottom">
          <p>
            © {new Date().getFullYear()} {legalName || shopName}
            {domain ? ` · ${domain}` : ""}. Tous droits réservés.
          </p>
          <p className="nkb-foot__power">
            <span>
              Propulsé par <a href="https://novakou.com">Novakou</a>
            </span>
            <a href="https://novakou.com" target="_blank" rel="noopener noreferrer">
              Créer ma boutique
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
