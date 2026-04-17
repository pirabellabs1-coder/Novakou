import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

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
  isFree: boolean;
};

async function fetchBestSellers(): Promise<Item[]> {
  try {
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
        img: f.thumbnail,
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
        isFree: f.isFree,
      };
    });

    const prodItems: Item[] = products.map((p) => {
      const isNew = now - p.createdAt.getTime() < SEVEN_DAYS;
      const isBestseller = p.salesCount >= 20;
      return {
        href: `/produit/${p.slug}`,
        img: p.banner,
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
        isFree: p.isFree,
      };
    });

    return [...formItems, ...prodItems]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 6);
  } catch (err) {
    console.warn("[BestSellers] DB fetch failed:", err);
    return [];
  }
}

export async function BestSellers() {
  const items = await fetchBestSellers();

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
          <div className="h-40 md:h-48 overflow-hidden rounded-t-[2rem] relative bg-gradient-to-br from-[#006e2f] to-[#22c55e]">
            {item.img ? (
              <Image
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                src={item.img}
                alt={item.title}
                width={300}
                height={192}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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
            <p className="text-sm text-[#5c647a] mb-5 line-clamp-2">{item.desc || "—"}</p>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg md:text-xl font-extrabold text-[#191c1e]">
                  {item.isFree ? "Gratuit" : `${new Intl.NumberFormat("fr-FR").format(item.priceFcfa)} FCFA`}
                </div>
                {!item.isFree && (
                  <div className="text-xs text-[#5c647a] font-medium mt-0.5">
                    ≈ {Math.round(item.priceFcfa / 655.957)} €
                  </div>
                )}
              </div>
              <div className="w-9 h-9 rounded-full bg-[#eceef0] flex items-center justify-center group-hover:bg-[#006e2f] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
