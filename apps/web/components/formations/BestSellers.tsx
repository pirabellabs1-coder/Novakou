import Link from "next/link";
import Image from "next/image";
import AdaptiveImage from "@/components/formations/AdaptiveImage";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cldUrl } from "@/lib/cloudinary-url";

/** Strip HTML tags for safe display in cards */
function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

type Item = {
  href: string;
  img: string | null;
  badge: "Bestseller" | "Nouveau" | "Populaire";
  badgeBg: string;
  rating: number;
  title: string;
  desc: string;
  priceFcfa: number;
  salesCount: number;
  reviewsCount: number;
  isFree: boolean;
  kind: "formation" | "product";
};

async function fetchBestSellers(): Promise<Item[]> {
  // ⚠️ PAS de try/catch ici : une erreur DB transitoire doit se PROPAGER
  // pour que `unstable_cache` NE mette PAS en cache un résultat vide. Sinon un
  // simple hoquet Supabase fige « Catalogue en construction » pendant 5 min
  // (ou pire, le grave dans le rendu statique du build). La gestion d'erreur
  // gracieuse est faite dans le composant <BestSellers/> (catch → fallback),
  // sans empoisonner le cache : la requête suivante réessaie à neuf.
  {
    // Fetch top formations + top products, merge and sort
    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { status: "ACTIF", hiddenFromMarketplace: false },
        orderBy: [{ studentsCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          slug: true,
          title: true,
          shortDesc: true,
          description: true,
          price: true,
          isFree: true,
          rating: true,
          studentsCount: true,
          reviewsCount: true,
          thumbnail: true,
          createdAt: true,
        },
      }),
      prisma.digitalProduct.findMany({
        where: { status: "ACTIF", hiddenFromMarketplace: false },
        orderBy: [{ salesCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          slug: true,
          title: true,
          description: true,
          price: true,
          isFree: true,
          rating: true,
          salesCount: true,
          reviewsCount: true,
          thumbnail: true,
          banner: true,
          createdAt: true,
        },
      }),
    ]);

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    const formItems: Item[] = formations.map((f) => {
      const isNew = now - f.createdAt.getTime() < SEVEN_DAYS;
      const isBestseller = f.studentsCount >= 20;
      return {
        href: `/formation/${f.slug}`,
        img: cldUrl(f.thumbnail, { width: 700, crop: "limit" }) ?? null,
        badge: isBestseller ? "Bestseller" : isNew ? "Nouveau" : "Populaire",
        badgeBg: isBestseller
          ? "bg-[#22c55e] text-[#004b1e]"
          : isNew
          ? "bg-[#dae2fd] text-[#5c647a]"
          : "bg-amber-100 text-amber-700",
        rating: f.rating,
        title: f.title,
        desc: f.shortDesc || stripHtml(f.description)?.slice(0, 80) || "",
        priceFcfa: f.price,
        salesCount: f.studentsCount,
        reviewsCount: f.reviewsCount ?? 0,
        isFree: f.isFree,
        kind: "formation" as const,
      };
    });

    const prodItems: Item[] = products.map((p) => {
      const isNew = now - p.createdAt.getTime() < SEVEN_DAYS;
      const isBestseller = p.salesCount >= 20;
      return {
        href: `/produit/${p.slug}`,
        // Cards prefer the dedicated thumbnail; fall back to banner for
        // legacy products that only ever uploaded one image.
        img: cldUrl(p.thumbnail ?? p.banner, { width: 700, crop: "limit" }) ?? null,
        badge: isBestseller ? "Bestseller" : isNew ? "Nouveau" : "Populaire",
        badgeBg: isBestseller
          ? "bg-[#22c55e] text-[#004b1e]"
          : isNew
          ? "bg-[#dae2fd] text-[#5c647a]"
          : "bg-amber-100 text-amber-700",
        rating: p.rating,
        title: p.title,
        desc: stripHtml(p.description)?.slice(0, 80) || "",
        priceFcfa: p.price,
        salesCount: p.salesCount,
        reviewsCount: p.reviewsCount ?? 0,
        isFree: p.isFree,
        kind: "product" as const,
      };
    });

    // Homepage spotlight = top 3 best-sellers across formations + products
    // (kept tight on purpose; the full catalog lives at /explorer).
    return [...formItems, ...prodItems]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 3);
  }
}

// Cache la requête bestsellers 5 min via le data cache de Next.js.
// Avant : SSR de la home faisait 2 queries Prisma → Supabase Frankfurt
// (~200-500ms aller-retour depuis Vercel us-east-1) → TTFB ~5s.
// Après : 1ère requête remplit le cache ; les 1000+ hits suivants dans
// les 5 min utilisent le cache → TTFB ~50ms. Le tag permet une
// invalidation manuelle si besoin (revalidateTag("bestsellers")).
const fetchBestSellersCached = unstable_cache(
  fetchBestSellers,
  ["bestsellers"],
  { revalidate: 300, tags: ["bestsellers"] },
);

export async function BestSellers() {
  // Le catch est ICI (pas dans la fonction cachée) : un échec DB ne sera donc
  // jamais mémorisé par unstable_cache — il sera réessayé à la requête suivante.
  let items: Item[] = [];
  try {
    items = await fetchBestSellersCached();
  } catch (err) {
    console.warn("[BestSellers] fetch failed (non caché, réessai au prochain hit):", err);
    items = [];
  }

  if (items.length === 0) {
    // Fallback empty state when no products yet
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <span className="material-symbols-outlined text-gray-300 text-5xl">storefront</span>
        <h3 className="text-lg font-bold text-[#191c1e] mt-3">Catalogue en construction</h3>
        <p className="text-sm text-[#5c647a] mt-1.5 mb-5">
          Soyez le premier à publier votre formation ou produit numérique.
        </p>
        <Link
          href="/inscription?role=vendeur"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add_business</span>
          Créer ma boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="bg-white squircle shadow-[0_10px_30px_rgba(0,0,0,0.03)] group hover:-translate-y-2 transition-all duration-300 block"
        >
          <div className="aspect-square overflow-hidden rounded-t-[2rem] relative bg-slate-100">
            {item.img ? (
              <AdaptiveImage src={item.img} alt={item.title} imgClassName="group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#006e2f] to-[#22c55e]">
                <span className="material-symbols-outlined text-white text-5xl opacity-80">school</span>
              </div>
            )}
          </div>
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-3">
              <span className={`${item.badgeBg} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                {item.badge}
              </span>
              {item.rating > 0 ? (
                <div className="flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-amber-400 text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="text-sm font-bold">{item.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-[#5c647a]">Nouveau</span>
              )}
            </div>
            <h3 className="font-bold text-base md:text-lg mb-1 text-[#191c1e] line-clamp-2">{item.title}</h3>
            <p className="text-sm text-[#5c647a] mb-3 line-clamp-2">{item.desc || "—"}</p>
            {/* Stats : avis à gauche, ventes à droite (justify-between pour espacer) */}
            <div className="flex items-center justify-between text-[11px] text-[#5c647a] mb-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {item.rating > 0 && item.reviewsCount >= 1 && (
                  <span className="font-bold text-[#191c1e]">{item.rating.toFixed(1)}</span>
                )}
                <span>{item.reviewsCount.toLocaleString("fr-FR")} avis</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">{item.kind === "formation" ? "group" : "shopping_bag"}</span>
                <span>{item.salesCount.toLocaleString("fr-FR")} {item.kind === "formation" ? "apprenant" : "vente"}{item.salesCount !== 1 ? "s" : ""}</span>
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-lg md:text-xl font-extrabold text-[#191c1e]">
                  {item.isFree ? "Gratuit" : `${new Intl.NumberFormat("fr-FR").format(item.priceFcfa)} FCFA`}
                </div>
              </div>
              <span className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl text-white text-xs font-bold bg-gradient-to-r from-[#006e2f] to-[#22c55e] group-hover:shadow-lg transition-shadow">
                <span className="material-symbols-outlined text-[16px]">
                  {item.isFree ? "play_arrow" : "shopping_cart"}
                </span>
                {item.isFree ? (item.kind === "formation" ? "Commencer" : "Télécharger") : "Acheter"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
