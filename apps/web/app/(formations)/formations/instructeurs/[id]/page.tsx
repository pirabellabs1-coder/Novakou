"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

type Profile = {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  country: string | null;
  bio: string | null;
  expertise: string[];
  linkedin: string | null;
  website: string | null;
  youtube: string | null;
  yearsExp: number;
  joinedAt: string;
  status: string;
};

type Formation = {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  thumbnail: string | null;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  customCategory: string | null;
};

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner: string | null;
  productType: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviewsCount: number;
  salesCount: number;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
  formation: { title: string };
};

type Data = {
  profile: Profile;
  formations: Formation[];
  products: Product[];
  stats: { totalStudents: number; totalProducts: number; avgRating: number; totalReviews: number };
  reviews: Review[];
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`material-symbols-outlined text-[14px] ${n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function InstructeurPublicPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: response, isLoading, error } = useQuery<{ data: Data; error?: string }>({
    queryKey: ["public-instructeur", id],
    queryFn: () => fetch(`/api/formations/public/instructeur/${id}`).then((r) => r.json()),
    enabled: !!id,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-5 aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="md:col-span-7 space-y-4">
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
            <div className="h-12 bg-gray-100 rounded w-64 animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || response?.error || !response?.data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-gray-300">person_search</span>
          </div>
          <p className="text-xl font-bold text-[#191c1e] mb-2">Instructeur introuvable</p>
          <p className="text-sm text-[#5c647a] mb-6">Ce profil n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link
            href="/formations/explorer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Explorer la marketplace
          </Link>
        </div>
      </div>
    );
  }

  const { profile, formations, products, stats, reviews } = response.data;
  const memberSince = new Date(profile.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Hero */}
        <header className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16 md:mb-24">
          <div className="md:col-span-5">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#006e2f]/80 to-emerald-600 relative">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-[120px] font-extrabold opacity-30">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-1.5 bg-[#22c55e] h-full" />
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-center">
            <span className="text-[#006e2f] text-xs uppercase tracking-[0.15em] mb-2 font-bold">
              {profile.status === "ACTIF" ? "Instructeur certifié" : "Instructeur"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-[1.05] text-[#191c1e]">
              {profile.name}
            </h1>

            {profile.bio ? (
              <p className="text-base md:text-lg text-[#5c647a] leading-relaxed mb-6 max-w-xl">
                {profile.bio}
              </p>
            ) : (
              <p className="text-base text-[#5c647a] italic mb-6">
                L&apos;instructeur n&apos;a pas encore rédigé sa biographie.
              </p>
            )}

            {/* Expertise tags */}
            {profile.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.expertise.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Social links */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#5c647a] hover:bg-gray-50 hover:text-[#006e2f] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  LinkedIn
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#5c647a] hover:bg-gray-50 hover:text-[#006e2f] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">language</span>
                  Site web
                </a>
              )}
              {profile.youtube && (
                <a
                  href={profile.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#5c647a] hover:bg-gray-50 hover:text-[#006e2f] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">play_circle</span>
                  YouTube
                </a>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100">
              <div>
                <p className="text-xs text-[#5c647a] uppercase tracking-widest mb-1 font-semibold">Apprenants</p>
                <p className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tabular-nums">
                  {stats.totalStudents.toLocaleString("fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5c647a] uppercase tracking-widest mb-1 font-semibold">Produits</p>
                <p className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tabular-nums">
                  {String(stats.totalProducts).padStart(2, "0")}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5c647a] uppercase tracking-widest mb-1 font-semibold">Note</p>
                <p className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tabular-nums">
                  {stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5` : "—"}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5c647a] mt-4">
              {profile.yearsExp > 0 && `${profile.yearsExp} an${profile.yearsExp > 1 ? "s" : ""} d'expérience · `}
              Membre depuis {memberSince}
              {profile.country && ` · ${profile.country}`}
            </p>
          </div>
        </header>

        {/* Formations */}
        {formations.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-[#006e2f] text-xs uppercase tracking-[0.15em] font-bold">Catalogue</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-[#191c1e]">Formations vidéo</h2>
              </div>
              <Link
                href="/formations/explorer?kind=formations"
                className="text-sm font-bold text-[#006e2f] flex items-center gap-1 hover:underline underline-offset-4"
              >
                Tout voir
                <span className="material-symbols-outlined text-sm">arrow_outward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {formations.map((f) => (
                <Link
                  key={f.id}
                  href={`/formations/formation/${f.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#006e2f]/20 transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-[#006e2f] to-emerald-500 flex items-center justify-center relative overflow-hidden">
                    {f.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.thumbnail} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="material-symbols-outlined text-white text-[48px] opacity-60" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                    )}
                    {f.customCategory && (
                      <span className="absolute top-3 left-3 bg-white/90 text-[#006e2f] px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {f.customCategory}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#191c1e] text-sm line-clamp-2 mb-2">{f.title}</h3>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Stars rating={f.rating} />
                      <span className="text-[11px] text-[#5c647a]">
                        {f.rating > 0 ? f.rating.toFixed(1) : "Nouveau"}
                        {f.reviewsCount > 0 && ` (${f.reviewsCount})`}
                      </span>
                      <span className="text-[11px] text-[#5c647a] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">groups</span>
                        <span className="font-semibold text-[#191c1e]">{f.studentsCount}</span>
                        élève{f.studentsCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-[#006e2f]">{formatFCFA(f.price)} FCFA</span>
                      {f.originalPrice && f.originalPrice > f.price && (
                        <span className="text-xs text-[#5c647a] line-through">{formatFCFA(f.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Digital products */}
        {products.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-violet-600 text-xs uppercase tracking-[0.15em] font-bold">Produits</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-[#191c1e]">Produits digitaux</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/formations/produit/${p.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-violet-500/20 transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                    {p.banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.banner} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="material-symbols-outlined text-white text-[48px] opacity-60" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 text-violet-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {p.productType}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#191c1e] text-sm line-clamp-2 mb-2">{p.title}</h3>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Stars rating={p.rating} />
                      <span className="text-[11px] text-[#5c647a]">
                        {p.rating > 0 ? p.rating.toFixed(1) : "Nouveau"}
                        {p.reviewsCount > 0 && ` (${p.reviewsCount})`}
                      </span>
                      <span className="text-[11px] text-[#5c647a] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">shopping_bag</span>
                        <span className="font-semibold text-[#191c1e]">{p.salesCount}</span>
                        vente{p.salesCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-violet-600">{formatFCFA(p.price)} FCFA</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-[#5c647a] line-through">{formatFCFA(p.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {formations.length === 0 && products.length === 0 && (
          <section className="bg-gray-50 rounded-2xl py-16 text-center mb-16">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px] text-gray-300">inventory_2</span>
            </div>
            <p className="font-bold text-[#191c1e] mb-1">Aucun produit publié pour l&apos;instant</p>
            <p className="text-sm text-[#5c647a]">
              {profile.name} prépare son premier produit. Revenez bientôt !
            </p>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-12">
            <div className="mb-8">
              <span className="text-[#006e2f] text-xs uppercase tracking-[0.15em] font-bold">Avis apprenants</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-[#191c1e]">
                Ce que disent les apprenants
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.slice(0, 4).map((r) => {
                const initials = (r.user.name ?? "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={r.id} className="p-6 bg-gray-50 rounded-2xl relative">
                    <span className="material-symbols-outlined absolute top-6 right-6 text-[#006e2f]/20 text-[48px]">format_quote</span>
                    <div className="flex items-center gap-2 mb-3">
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-sm italic text-[#5c647a] leading-relaxed mb-6 relative z-10">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      {r.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#006e2f] to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#191c1e] text-sm">{r.user.name ?? "Anonyme"}</p>
                        <p className="text-xs text-[#5c647a]">Sur « {r.formation.title} »</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
