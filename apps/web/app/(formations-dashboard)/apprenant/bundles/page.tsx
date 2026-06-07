// Refonte style KAZA — apprenant bundles — 2026-06-07
"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  KazaHero,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Package}
        title="Mes packs"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${purchases.length} pack${purchases.length > 1 ? "s" : ""} Novakou · Accès à vie au contenu inclus`
        }
        actions={
          <KazaButton variant="primary" href="/explorer?tab=bundles" icon={Search}>
            Découvrir les packs
          </KazaButton>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
              <div className="h-32 bg-slate-100 rounded-xl mb-4" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-rose-700">
            Impossible de charger vos packs. Réessayez dans un instant.
          </p>
        </div>
      )}

      {!isLoading && !error && purchases.length === 0 && (
        <KazaEmpty
          icon={Package}
          title="Aucun pack pour le moment"
          description="Les packs Novakou réunissent plusieurs formations et produits à prix réduit. Découvrez ceux disponibles dans l'explorer."
          action={{ label: "Découvrir les packs", href: "/explorer?tab=bundles" }}
        />
      )}

      {!isLoading && purchases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all"
              >
                <Link href={`/bundle/${p.bundle.slug}`} className="block">
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-[#0b2540] to-[#1a4a7d] overflow-hidden">
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
                      <KazaBadge variant="green" size="sm" icon={Package}>
                        Pack · {itemCount} contenu{itemCount > 1 ? "s" : ""}
                      </KazaBadge>
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  <Link href={`/bundle/${p.bundle.slug}`} className="block">
                    <h3 className="font-extrabold text-base text-[#0b2540] line-clamp-2 group-hover:text-emerald-700 transition-colors mb-2">
                      {p.bundle.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5 flex-wrap">
                    <UserIcon className="w-3 h-3" />
                    par <span className="font-semibold text-slate-700">{seller}</span>
                    {p.bundle.shop && (
                      <>
                        <span className="text-slate-300">·</span>
                        <Link href={`/boutique/${p.bundle.shop.slug}`} className="hover:underline">
                          {p.bundle.shop.name}
                        </Link>
                      </>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {formationCount > 0 && (
                      <KazaBadge variant="green" size="md" icon={PlayCircle}>
                        {formationCount} formation{formationCount > 1 ? "s" : ""}
                      </KazaBadge>
                    )}
                    {productCount > 0 && (
                      <KazaBadge variant="violet" size="md" icon={Download}>
                        {productCount} produit{productCount > 1 ? "s" : ""}
                      </KazaBadge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 pb-4 border-b border-slate-100">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Acheté {relativeDate(p.createdAt)}
                    </span>
                    <span className="font-bold text-emerald-600 tabular-nums">{fmtFCFA(p.paidAmount)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <KazaButton
                      variant="primary"
                      size="sm"
                      href="/apprenant/mes-formations"
                      icon={Play}
                      className="flex-1"
                    >
                      Accéder au contenu
                    </KazaButton>
                    <KazaButton
                      variant="ghost"
                      size="sm"
                      href={`/bundle/${p.bundle.slug}`}
                      icon={Eye}
                    >
                      Voir
                    </KazaButton>
                  </div>

                  {myReview && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= myReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1 uppercase tracking-wider font-bold">
                          Votre avis
                        </span>
                      </div>
                      {myReview.comment && (
                        <p className="text-xs text-slate-600 italic line-clamp-2">
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
    </div>
  );
}
