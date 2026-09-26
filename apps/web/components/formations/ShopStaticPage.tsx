import { ChevronRight } from "lucide-react";
import { SHOP_STATIC_PAGES, buildShopStaticContent, type ShopStaticSlug, type ShopLegalInfo } from "@/lib/formations/shop-static";
import { shopFontStack } from "@/lib/formations/shop-fonts";
import { ShopHeader } from "./ShopHeader";
import ShopFooter from "./ShopFooter";
import { ShopContactForm } from "./boutique/ShopContactForm";
import { accentVars } from "./boutique/accent";
import "./boutique/boutique.css";

/**
 * Page statique de boutique (à propos, contact, mentions légales…) : même
 * coque que la vitrine (île de menu + pied de boutique), contenu dans une
 * carte double-bezel, formulaire de contact sur la page « Contact ».
 * `base` = préfixe des liens boutique ("" domaine perso, "/{slug}" sinon).
 */
export default function ShopStaticPage({
  slug,
  info,
  base,
  themeColor,
  logoUrl,
  font,
}: {
  slug: ShopStaticSlug;
  info: ShopLegalInfo;
  base: string;
  themeColor: string | null;
  logoUrl: string | null;
  font?: string | null;
}) {
  const meta = SHOP_STATIC_PAGES[slug];
  const { intro, blocks } = buildShopStaticContent(slug, info, base);
  // « Inter » n'est pas embarquée : on laisse la police du site (Manrope).
  const police = font && font !== "Inter" ? shopFontStack(font) : undefined;

  return (
    <div className="nkb nkb-static" style={{ ...accentVars(themeColor), ...(police ? { fontFamily: police } : {}) }}>
      <ShopHeader shopName={info.shopName} logoUrl={logoUrl} themeColor={themeColor} staticBase={base} />

      <div className="nkb-static__main">
        <div className="nkb-static__inner">
          <nav className="nkb-crumbs" aria-label="Fil d'Ariane">
            <a href={base || "/"}>Accueil</a>
            <ChevronRight strokeWidth={2} aria-hidden="true" />
            <span aria-current="page">{meta.title}</span>
          </nav>

          <article className="nkb-bezel nkb-bezel--xl nkb-bezel--float nkb-doc">
            <div className="nkb-doc__core nkb-core">
              <h1 className="nkb-doc__title">{meta.title}</h1>
              {info.updatedLabel && <p className="nkb-doc__updated">Dernière mise à jour : {info.updatedLabel}</p>}
              {intro && <p className="nkb-doc__intro">{intro}</p>}

              <div className="nkb-doc__body">
                {blocks.map((b, i) => {
                  if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
                  if (b.type === "p") return <p key={i}>{b.text}</p>;
                  if (b.type === "info") {
                    return (
                      <dl key={i} className="nkb-info">
                        {b.rows.map((r, j) => (
                          <div key={j} className="nkb-info__row">
                            <dt className="nkb-info__l">{r.label}</dt>
                            <dd className="nkb-info__v">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    );
                  }
                  if (b.type === "links") {
                    return (
                      <ul key={i} className="nkb-doc__links">
                        {b.links.map((l, j) => (
                          <li key={j}>
                            <a href={l.href}>{l.label}</a>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return null;
                })}
              </div>

              {slug === "contact" && <ShopContactForm email={info.email} shopName={info.shopName} />}
            </div>
          </article>
        </div>
      </div>

      <ShopFooter
        shopSlug={base.replace(/^\//, "")}
        shopName={info.shopName}
        legalName={info.legalName}
        base={base}
        themeColor={themeColor}
        logoUrl={logoUrl}
      />
    </div>
  );
}
