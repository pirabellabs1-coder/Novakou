import { SHOP_STATIC_PAGES, type ShopStaticSlug } from "@/lib/formations/shop-static";

/**
 * Pied de page d'une BOUTIQUE, réutilisé au bas des pages produit/formation
 * qui appartiennent à cette boutique (l'identité, c'est la boutique).
 */
export default function ShopFooter({
  shopSlug,
  shopName,
  legalName,
}: {
  shopSlug: string;
  shopName: string;
  legalName?: string | null;
}) {
  const base = `/boutique/${shopSlug}`;
  const boutiqueLinks = (Object.keys(SHOP_STATIC_PAGES) as ShopStaticSlug[]).filter((s) => SHOP_STATIC_PAGES[s].footerGroup === "boutique");
  const legalLinks = (Object.keys(SHOP_STATIC_PAGES) as ShopStaticSlug[]).filter((s) => SHOP_STATIC_PAGES[s].footerGroup === "legales");
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 text-sm">
          <div className="col-span-2 sm:col-span-1">
            <a href={base} className="font-extrabold text-slate-900 hover:text-emerald-700">{shopName}</a>
            <p className="text-xs text-slate-400 mt-1.5">Boutique en ligne</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">Boutique</p>
            <ul className="space-y-2">
              {boutiqueLinks.map((s) => (
                <li key={s}><a href={`${base}/${s}`} className="text-slate-600 hover:text-slate-900">{SHOP_STATIC_PAGES[s].title}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">Légales</p>
            <ul className="space-y-2">
              {legalLinks.map((s) => (
                <li key={s}><a href={`${base}/${s}`} className="text-slate-600 hover:text-slate-900">{SHOP_STATIC_PAGES[s].title}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-6 border-t border-slate-100">
          © {new Date().getFullYear()} {legalName || shopName}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
