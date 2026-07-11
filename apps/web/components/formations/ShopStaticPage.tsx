import Link from "next/link";
import { SHOP_STATIC_PAGES, buildShopStaticContent, type ShopStaticSlug, type ShopLegalInfo } from "@/lib/formations/shop-static";

/**
 * Rendu d'une page statique de boutique (à propos, contact, mentions légales…).
 * Style aligné sur la boutique (couleur de thème), en-tête + pied avec liens.
 * `base` = préfixe des liens boutique ("" domaine perso, "/boutique/{slug}" sinon).
 */
export default function ShopStaticPage({
  slug,
  info,
  base,
  themeColor,
  logoUrl,
}: {
  slug: ShopStaticSlug;
  info: ShopLegalInfo;
  base: string;
  themeColor: string | null;
  logoUrl: string | null;
}) {
  const meta = SHOP_STATIC_PAGES[slug];
  const { intro, blocks } = buildShopStaticContent(slug, info, base);
  const accent = themeColor || "#006e2f";
  const boutiqueLinks = (Object.keys(SHOP_STATIC_PAGES) as ShopStaticSlug[]).filter((s) => SHOP_STATIC_PAGES[s].footerGroup === "boutique");
  const legalLinks = (Object.keys(SHOP_STATIC_PAGES) as ShopStaticSlug[]).filter((s) => SHOP_STATIC_PAGES[s].footerGroup === "legales");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-4 flex items-center gap-3">
          <Link href={base || "/"} className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={info.shopName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold flex-shrink-0" style={{ background: accent }}>
                {info.shopName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-extrabold text-slate-900 truncate">{info.shopName}</span>
          </Link>
        </div>
      </header>

      {/* Contenu — pleine largeur lisible */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <nav className="text-xs text-slate-400 mb-4">
            <Link href={base || "/"} className="hover:text-slate-600">Accueil</Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-600">{meta.title}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{meta.title}</h1>
          {info.updatedLabel && (
            <p className="text-xs text-slate-400 mt-2">Dernière mise à jour : {info.updatedLabel}</p>
          )}
          {intro && <p className="text-[15px] text-slate-600 mt-4 leading-relaxed">{intro}</p>}

          <div className="mt-6 space-y-5">
            {blocks.map((b, i) => {
              if (b.type === "h2") return <h2 key={i} className="text-lg font-extrabold text-slate-900 mt-8 first:mt-0">{b.text}</h2>;
              if (b.type === "p") return <p key={i} className="text-[14.5px] text-slate-600 leading-relaxed">{b.text}</p>;
              if (b.type === "info") return (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  {b.rows.map((r, j) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400 sm:w-44 flex-shrink-0">{r.label}</span>
                      <span className="text-sm font-semibold text-slate-800 break-words">{r.value}</span>
                    </div>
                  ))}
                </div>
              );
              if (b.type === "links") return (
                <ul key={i} className="space-y-2">
                  {b.links.map((l, j) => (
                    <li key={j}>
                      <Link href={l.href} className="text-[14.5px] font-semibold hover:underline" style={{ color: accent }}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              );
              return null;
            })}
          </div>
        </div>
      </main>

      {/* Pied — liens auto */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Boutique</p>
              <ul className="space-y-1.5">
                {boutiqueLinks.map((s) => (
                  <li key={s}><Link href={`${base}/${s}`} className="text-slate-600 hover:text-slate-900">{SHOP_STATIC_PAGES[s].title}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Légales</p>
              <ul className="space-y-1.5">
                {legalLinks.map((s) => (
                  <li key={s}><Link href={`${base}/${s}`} className="text-slate-600 hover:text-slate-900">{SHOP_STATIC_PAGES[s].title}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6">© {new Date().getFullYear()} {info.legalName}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
