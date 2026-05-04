import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { avatarSrc } from "@/lib/utils/image-url";
import AffiliateClickTracker from "./AffiliateClickTracker";

// Affiliate codes are 6–12 chars (validated in lib/marketing/affiliate-tracker.ts).
// Reject anything else early so we never hit Prisma with a garbage URL segment.
const VALID_CODE = /^[A-Za-z0-9_-]{6,12}$/;

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

async function loadAffiliate(code: string) {
  if (!VALID_CODE.test(code)) return null;

  const profile = await prisma.affiliateProfile
    .findUnique({
      where: { affiliateCode: code },
      select: {
        id: true,
        affiliateCode: true,
        status: true,
        totalConversions: true,
        program: {
          select: {
            commissionPct: true,
            name: true,
            // applyToAll = false ⇒ scope strictement aux IDs ci-dessous
            applyToAll: true,
            formationIds: true,
            productIds: true,
          },
        },
        user: {
          select: { id: true, name: true, image: true, country: true },
        },
      },
    })
    .catch(() => null);

  if (!profile || profile.status !== "ACTIVE") return null;
  return profile;
}

type Program = {
  applyToAll: boolean;
  formationIds: string[];
  productIds: string[];
} | null | undefined;

/**
 * Charge UNIQUEMENT les produits que cet affilié peut promouvoir, c'est-à-
 * dire ceux explicitement scopés par son programme. Si `applyToAll` est vrai,
 * on tombe sur le top plateforme. Si la liste est vide ET `applyToAll` est
 * faux, la boutique reste vide — c'est volontaire : un affilié sans aucun
 * produit éligible n'a rien à montrer.
 */
async function loadCatalog(program: Program) {
  if (!program) return { formations: [], products: [] };

  const formationFilter = program.applyToAll
    ? {}
    : { id: { in: program.formationIds.length > 0 ? program.formationIds : ["__none__"] } };
  const productFilter = program.applyToAll
    ? {}
    : { id: { in: program.productIds.length > 0 ? program.productIds : ["__none__"] } };

  const [formations, products] = await Promise.all([
    prisma.formation
      .findMany({
        where: { status: "ACTIF", ...formationFilter },
        select: {
          id: true, title: true, slug: true, thumbnail: true,
          customCategory: true, price: true, originalPrice: true,
          rating: true, reviewsCount: true, studentsCount: true,
        },
        orderBy: [{ studentsCount: "desc" }, { rating: "desc" }],
        take: 24,
      })
      .catch(() => []),
    prisma.digitalProduct
      .findMany({
        where: { status: "ACTIF", hiddenFromMarketplace: false, ...productFilter },
        select: {
          id: true, title: true, slug: true,
          thumbnail: true, banner: true,
          productType: true, price: true, originalPrice: true,
          rating: true, reviewsCount: true, salesCount: true,
        },
        orderBy: [{ salesCount: "desc" }, { rating: "desc" }],
        take: 24,
      })
      .catch(() => []),
  ]);
  return { formations, products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const profile = await loadAffiliate(code);
  if (!profile) return { title: "Boutique introuvable" };
  const name = profile.user.name ?? "Affilié Novakou";
  return {
    title: `${name} — Boutique partenaire`,
    description: `Découvrez les formations et produits numériques recommandés par ${name} sur Novakou.`,
    alternates: { canonical: `/a/${code}` },
    openGraph: {
      title: `${name} — Boutique partenaire`,
      description: `Sélection de formations et produits numériques par ${name}.`,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AffiliateBoutiquePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const profile = await loadAffiliate(code);
  if (!profile) notFound();

  const { formations, products } = await loadCatalog(profile.program);
  const name = profile.user.name ?? "Affilié Novakou";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const commissionPct = profile.program?.commissionPct ?? null;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Records the click against this affiliate code + drops the cookie
          so a subsequent purchase attributes commission. */}
      <AffiliateClickTracker code={code} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003d1a] via-[#006e2f] to-emerald-500 text-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="flex items-center gap-5 md:gap-7">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center text-2xl md:text-3xl font-extrabold flex-shrink-0">
              {profile.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc(profile.user.image, 400) ?? profile.user.image}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
                Boutique partenaire
              </p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
                {name}
              </h1>
              <p className="text-white/85 text-sm md:text-base mt-3 max-w-2xl">
                Voici une sélection de formations et de produits numériques que je recommande sur Novakou.
                Tous les achats faits depuis cette page me soutiennent — sans coût supplémentaire pour vous.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-10 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Formations</p>
              <p className="text-xl md:text-2xl font-extrabold tabular-nums mt-1">{formations.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Produits</p>
              <p className="text-xl md:text-2xl font-extrabold tabular-nums mt-1">{products.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {commissionPct !== null ? "Commission" : "Achats suivis"}
              </p>
              <p className="text-xl md:text-2xl font-extrabold tabular-nums mt-1">
                {commissionPct !== null ? `${commissionPct}%` : profile.totalConversions}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
        {formations.length === 0 && products.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl">inventory_2</span>
            <p className="text-base font-bold text-[#191c1e] mt-3">Catalogue bientôt disponible</p>
            <p className="text-sm text-[#5c647a] mt-1">{name} n&apos;a pas encore sélectionné de produits à recommander.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {formations.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#006e2f]">Formations vidéo</p>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#191c1e] mt-1">À découvrir</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {formations.map((f) => {
                    const discount =
                      f.originalPrice && f.originalPrice > f.price
                        ? Math.round(((f.originalPrice - f.price) / f.originalPrice) * 100)
                        : 0;
                    return (
                      <article key={f.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#006e2f]/20 transition-all flex flex-col">
                        <Link href={`/formation/${f.slug}?ref=${code}`} className="block">
                          <div className="aspect-square bg-gradient-to-br from-[#006e2f] to-emerald-500 relative overflow-hidden">
                            {f.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.thumbnail} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                              </div>
                            )}
                            {discount > 0 && (
                              <span className="absolute top-3 right-3 bg-zinc-900 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide shadow-md">
                                -{discount}% OFF
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="p-4 flex flex-col gap-3 flex-1">
                          <Link href={`/formation/${f.slug}?ref=${code}`}>
                            <h3 className="font-bold text-[#191c1e] text-sm line-clamp-2 hover:text-[#006e2f] transition-colors">{f.title}</h3>
                          </Link>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-extrabold text-[#006e2f]">{fmtFCFA(f.price)} FCFA</span>
                            {f.originalPrice && f.originalPrice > f.price && (
                              <span className="text-xs text-[#5c647a] line-through">{fmtFCFA(f.originalPrice)}</span>
                            )}
                          </div>
                          <Link
                            href={`/checkout?fids=${f.id}&ref=${code}`}
                            className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                            Acheter maintenant
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">Produits numériques</p>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#191c1e] mt-1">E-books, templates, packs</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((p) => {
                    const discount =
                      p.originalPrice && p.originalPrice > p.price
                        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                        : 0;
                    return (
                      <article key={p.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-violet-500/20 transition-all flex flex-col">
                        <Link href={`/produit/${p.slug}?ref=${code}`} className="block">
                          <div className="aspect-square bg-gradient-to-br from-violet-500 to-purple-600 relative overflow-hidden">
                            {(p.thumbnail || p.banner) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.thumbnail ?? p.banner ?? ""} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                              </div>
                            )}
                            <span className="absolute top-3 left-3 bg-white/95 text-violet-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {p.productType}
                            </span>
                            {discount > 0 && (
                              <span className="absolute top-3 right-3 bg-zinc-900 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide shadow-md">
                                -{discount}% OFF
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="p-4 flex flex-col gap-3 flex-1">
                          <Link href={`/produit/${p.slug}?ref=${code}`}>
                            <h3 className="font-bold text-[#191c1e] text-sm line-clamp-2 hover:text-violet-600 transition-colors">{p.title}</h3>
                          </Link>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-extrabold text-violet-600">{fmtFCFA(p.price)} FCFA</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-xs text-[#5c647a] line-through">{fmtFCFA(p.originalPrice)}</span>
                            )}
                          </div>
                          <Link
                            href={`/checkout?pids=${p.id}&ref=${code}`}
                            className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                            Acheter maintenant
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[#5c647a] mt-12">
          Vous voulez aussi recommander des produits Novakou et toucher des commissions ?{" "}
          <Link href="/inscription?role=affilie" className="text-[#006e2f] font-bold hover:underline">
            Devenez affilié
          </Link>
        </p>
      </section>
    </div>
  );
}
