import type { Metadata } from "next";
import {
  Download,
  Package,
  PlayCircle,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { avatarSrc } from "@/lib/utils/image-url";
import { inter, sora } from "@/lib/fonts";
import "@/components/formations/achat/achat.css";
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
    <div className={`nka ${inter.variable} ${sora.variable} min-h-screen bg-[#f7f9fb]`}>
      {/* Records the click against this affiliate code + drops the cookie
          so a subsequent purchase attributes commission. */}
      <AffiliateClickTracker code={code} />

      {/* Hero */}
      <section className="nka-night">
        <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center md:gap-7">
            <div className="nka-glass h-20 w-20 flex-shrink-0 p-1.5 md:h-24 md:w-24">
              <div className="grid h-full w-full place-items-center overflow-hidden rounded-[13px] bg-white/10 text-2xl font-extrabold md:text-3xl">
                {profile.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc(profile.user.image, 400) ?? profile.user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="nka-eyebrow">
                Boutique partenaire
              </p>
              <h1 className="nka-h1 nka-h1--xl mt-3">
                {name}
              </h1>
              <p className="nka-lead mt-3 max-w-2xl md:text-base">
                Voici une sélection de formations et de produits numériques que je recommande sur Novakou.
                Tous les achats faits depuis cette page me soutiennent — sans coût supplémentaire pour vous.
              </p>
            </div>
          </div>

          <dl className="mt-8 grid max-w-md grid-cols-3 gap-2.5 md:mt-10 md:gap-4">
            <div className="nka-glass px-3.5 py-3 sm:px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-white/70">Formations</dt>
              <dd className="nka-stat mt-1">{formations.length}</dd>
            </div>
            <div className="nka-glass px-3.5 py-3 sm:px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-white/70">Produits</dt>
              <dd className="nka-stat mt-1">{products.length}</dd>
            </div>
            <div className="nka-glass px-3.5 py-3 sm:px-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                {commissionPct !== null ? "Commission" : "Achats suivis"}
              </dt>
              <dd className="nka-stat mt-1">
                {commissionPct !== null ? `${commissionPct}%` : profile.totalConversions}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        {formations.length === 0 && products.length === 0 ? (
          <div className="nka-bezel mx-auto max-w-xl">
            <div className="nka-bezel__core px-6 py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f0f6f2] text-[#006e2f] shadow-[inset_0_0_0_1px_rgba(0,110,47,0.12)]">
                <Package size={30} aria-hidden="true" />
              </div>
              <p className="nka-h2 mt-4">Catalogue bientôt disponible</p>
              <p className="mt-1 text-sm text-[#5c6b62]">{name} n&apos;a pas encore sélectionné de produits à recommander.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-14">
            {formations.length > 0 && (
              <div>
                <div className="mb-6">
                  <p className="nka-eyebrow">Formations vidéo</p>
                  <h2 className="nka-h1 nka-h1--sm mt-2">À découvrir</h2>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {formations.map((f) => {
                    const discount =
                      f.originalPrice && f.originalPrice > f.price
                        ? Math.round(((f.originalPrice - f.price) / f.originalPrice) * 100)
                        : 0;
                    return (
                      <article key={f.id} className="nka-bezel nka-card group">
                        <div className="nka-bezel__core">
                          {/* Doublon du lien titre : retiré du clavier et des lecteurs d'écran. */}
                          <Link href={`/formation/${f.slug}?ref=${code}`} className="block" tabIndex={-1} aria-hidden="true">
                            <div className="nka-media relative aspect-[4/3]">
                              {f.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={f.thumbnail} alt="" loading="lazy" className="nka-card__img h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#032314] to-[#006e2f]">
                                  <PlayCircle size={44} className="text-white/60" />
                                </div>
                              )}
                              {discount > 0 && (
                                <span className="nka-chip nka-chip--ink nka-num absolute right-3 top-3">
                                  -{discount}% OFF
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                            <Link href={`/formation/${f.slug}?ref=${code}`} className="nka-card__title">
                              <h3 className="line-clamp-2 text-[0.9375rem] font-bold leading-snug text-[#0e1512] transition-colors group-hover:text-[#006e2f]">{f.title}</h3>
                            </Link>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="nka-price">{fmtFCFA(f.price)} FCFA</span>
                              {f.originalPrice && f.originalPrice > f.price && (
                                <s className="nka-price__old">{fmtFCFA(f.originalPrice)}</s>
                              )}
                            </div>
                            <Link
                              href={`/checkout?fids=${f.id}&ref=${code}`}
                              className="nka-btn nka-btn--ink nka-btn--block mt-auto"
                            >
                              <span className="nka-btn__label">
                                <ShoppingBag aria-hidden="true" />
                                Acheter maintenant
                              </span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <div className="mb-6">
                  <p className="nka-eyebrow">Produits numériques</p>
                  <h2 className="nka-h1 nka-h1--sm mt-2">E-books, templates, packs</h2>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => {
                    const discount =
                      p.originalPrice && p.originalPrice > p.price
                        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                        : 0;
                    return (
                      <article key={p.id} className="nka-bezel nka-card group">
                        <div className="nka-bezel__core">
                          {/* Doublon du lien titre : retiré du clavier et des lecteurs d'écran. */}
                          <Link href={`/produit/${p.slug}?ref=${code}`} className="block" tabIndex={-1} aria-hidden="true">
                            <div className="nka-media relative aspect-[4/3]">
                              {(p.thumbnail || p.banner) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.thumbnail ?? p.banner ?? ""} alt="" loading="lazy" className="nka-card__img h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#032314] to-[#006e2f]">
                                  <Download size={44} className="text-white/60" />
                                </div>
                              )}
                              <span className="nka-chip absolute left-3 top-3">
                                {p.productType}
                              </span>
                              {discount > 0 && (
                                <span className="nka-chip nka-chip--ink nka-num absolute right-3 top-3">
                                  -{discount}% OFF
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                            <Link href={`/produit/${p.slug}?ref=${code}`} className="nka-card__title">
                              <h3 className="line-clamp-2 text-[0.9375rem] font-bold leading-snug text-[#0e1512] transition-colors group-hover:text-[#006e2f]">{p.title}</h3>
                            </Link>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="nka-price">{fmtFCFA(p.price)} FCFA</span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <s className="nka-price__old">{fmtFCFA(p.originalPrice)}</s>
                              )}
                            </div>
                            <Link
                              href={`/checkout?pids=${p.id}&ref=${code}`}
                              className="nka-btn nka-btn--ink nka-btn--block mt-auto"
                            >
                              <span className="nka-btn__label">
                                <ShoppingBag aria-hidden="true" />
                                Acheter maintenant
                              </span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-14 text-center text-sm text-[#5c6b62]">
          Vous voulez aussi recommander des produits Novakou et toucher des commissions ?{" "}
          <Link href="/inscription?role=affilie" className="nka-titlelink font-bold text-[#006e2f] underline underline-offset-2">
            Devenez affilié
          </Link>
        </p>
      </section>
    </div>
  );
}
