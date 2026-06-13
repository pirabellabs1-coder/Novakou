// Refonte design "Stitch" — apprenant bundles — vert Novakou — 2026-06-13
"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { StCard, StPageHeader, StButton, StChip, ST } from "@/components/stitch";
import {
  Package,
  Search,
  PlayCircle,
  Download,
  Calendar,
  User as UserIcon,
  Star,
  Eye,
  Play,
} from "lucide-react";

type BundlePurchase = {
  id: string;
  paidAmount: number;
  createdAt: string;
  bundle: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    banner: string | null;
    priceXof: number;
    rating: number;
    reviewsCount: number;
    items: { itemKind: "formation" | "digital" }[];
    instructeur: { user: { name: string | null; image: string | null } };
    shop: { slug: string; name: string } | null;
    reviews: { id: string; rating: number; comment: string | null }[];
  };
};

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function relativeDate(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${days >= 14 ? "s" : ""}`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ApprenantBundlesPage() {
  const { data, isLoading, error } = useQuery<{ data: BundlePurchase[] }>({
    queryKey: ["apprenant-bundles"],
    queryFn: () => fetch("/api/formations/apprenant/bundles").then((r) => r.json()),
    staleTime: 30_000,
  });

  const purchases = data?.data ?? [];

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes packs"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${purchases.length} pack${purchases.length > 1 ? "s" : ""} Novakou · Accès à vie au contenu inclus`
          }
          actions={
            <StButton href="/explorer?tab=bundles" icon={Search}>
              Découvrir les packs
            </StButton>
          }
        />

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-[18px] bg-white p-5 animate-pulse" style={{ border: `1px solid ${ST.cardBorder}` }}>
                <div className="h-32 rounded-xl mb-4" style={{ background: "#f3f6f4" }} />
                <div className="h-4 rounded w-3/4 mb-2" style={{ background: "#f3f6f4" }} />
                <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <StCard className="!p-6 text-center" style={{ background: ST.roseSoft, borderColor: "#f3cdd8" }}>
            <p className="text-[13px] font-semibold" style={{ color: ST.roseText }}>
              Impossible de charger vos packs. Réessayez dans un instant.
            </p>
          </StCard>
        )}

        {!isLoading && !error && purchases.length === 0 && (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Package size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucun pack pour le moment</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Les packs Novakou réunissent plusieurs formations et produits à prix réduit. Découvrez ceux disponibles dans l&apos;explorer.
            </p>
            <StButton href="/explorer?tab=bundles" icon={Search}>Découvrir les packs</StButton>
          </StCard>
        )}

        {!isLoading && purchases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((p) => {
              const formationCount = p.bundle.items.filter((i) => i.itemKind === "formation").length;
              const productCount = p.bundle.items.filter((i) => i.itemKind === "digital").length;
              const itemCount = p.bundle.items.length;
              const heroImg = p.bundle.thumbnail ?? p.bundle.banner;
              const seller = p.bundle.instructeur.user.name ?? "Créateur";
              const myReview = p.bundle.reviews[0];

              return (
                <article
                  key={p.id}
                  className="group bg-white rounded-[18px] overflow-hidden hover:-translate-y-1 transition-all"
                  style={{ border: `1px solid ${ST.cardBorder}`, boxShadow: "0 1px 3px rgba(16,52,32,.05)" }}
                >
                  <Link href={`/bundle/${p.bundle.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden" style={{ background: ST.gradient }}>
                      {heroImg ? (
                        <Image
                          src={heroImg}
                          alt={p.bundle.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-16 h-16 text-white/30" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <StChip tone="green" icon={Package}>
                          Pack · {itemCount} contenu{itemCount > 1 ? "s" : ""}
                        </StChip>
                      </div>
                    </div>
                  </Link>

                  <div className="p-5">
                    <Link href={`/bundle/${p.bundle.slug}`} className="block">
                      <h3 className="font-extrabold text-[15px] line-clamp-2 transition-colors mb-2" style={{ color: ST.text }}>
                        {p.bundle.title}
                      </h3>
                    </Link>

                    <p className="text-[12px] font-semibold mb-3 flex items-center gap-1.5 flex-wrap" style={{ color: ST.textSecondary }}>
                      <UserIcon className="w-3 h-3" />
                      par <span className="font-extrabold" style={{ color: ST.text }}>{seller}</span>
                      {p.bundle.shop && (
                        <>
                          <span style={{ color: ST.textFaint }}>·</span>
                          <Link href={`/boutique/${p.bundle.shop.slug}`} className="hover:underline">
                            {p.bundle.shop.name}
                          </Link>
                        </>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {formationCount > 0 && (
                        <StChip tone="green" icon={PlayCircle}>
                          {formationCount} formation{formationCount > 1 ? "s" : ""}
                        </StChip>
                      )}
                      {productCount > 0 && (
                        <StChip tone="blue" icon={Download}>
                          {productCount} produit{productCount > 1 ? "s" : ""}
                        </StChip>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold mb-4 pb-4" style={{ color: ST.textMuted, borderBottom: `1px solid ${ST.divider}` }}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Acheté {relativeDate(p.createdAt)}
                      </span>
                      <span className="font-extrabold tabular-nums" style={{ color: ST.green }}>{fmtFCFA(p.paidAmount)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StButton size="sm" href="/apprenant/mes-formations" icon={Play} className="flex-1">
                        Accéder au contenu
                      </StButton>
                      <StButton variant="secondary" size="sm" href={`/bundle/${p.bundle.slug}`} icon={Eye}>
                        Voir
                      </StButton>
                    </div>

                    {myReview && (
                      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${ST.divider}` }}>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= myReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                            />
                          ))}
                          <span className="text-[10px] ml-1 uppercase tracking-wider font-extrabold" style={{ color: ST.textFaint }}>
                            Votre avis
                          </span>
                        </div>
                        {myReview.comment && (
                          <p className="text-[12px] italic line-clamp-2" style={{ color: ST.textSecondary }}>
                            « {myReview.comment} »
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
