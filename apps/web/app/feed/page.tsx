"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MOCK_SERVICES,
  MOCK_VENDORS,
  CATEGORIES,
  type MockService,
  type MockVendor,
} from "@/lib/dev/mock-data";
import { CategoryBar } from "@/components/navbar/CategoryBar";
import { type ApiService } from "@/lib/api-client";

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICES_PER_PAGE = 100;

type FeedTab = "pour-vous" | "meilleurs" | "nouveaux";

const SORT_OPTIONS = [
  { value: "pertinence", label: "Pertinence" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "note", label: "Meilleures notes" },
  { value: "nouveaute", label: "Nouveautés" },
  { value: "popularite", label: "Plus populaires" },
];

// ─── Multiply mock services to have enough data ──────────────────────────────

function multiplyServices(services: MockService[], targetCount: number): MockService[] {
  if (services.length >= targetCount) return services;
  const result: MockService[] = [];
  let index = 0;
  while (result.length < targetCount) {
    const original = services[index % services.length];
    result.push({
      ...original,
      id: `${original.id}_${Math.floor(index / services.length)}`,
      // Vary some data for realism
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 200) + 5,
      orderCount: Math.floor(Math.random() * 300) + 1,
      packages: {
        ...original.packages,
        basic: {
          ...original.packages.basic,
          price: [10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100, 150, 200][Math.floor(Math.random() * 13)],
        },
        standard: {
          ...original.packages.standard,
          price: [30, 50, 75, 100, 150, 200, 250, 300][Math.floor(Math.random() * 8)],
        },
        premium: {
          ...original.packages.premium,
          price: [100, 150, 200, 300, 400, 500, 750, 1000][Math.floor(Math.random() * 8)],
        },
      },
    });
    index++;
  }
  return result;
}

const EXPANDED_SERVICES = multiplyServices(MOCK_SERVICES, 500);

// Map API services to MockService format for feed display
function mapApiToMock(s: ApiService): MockService {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.descriptionText || "",
    shortDesc: (s.descriptionText || "").slice(0, 120),
    category: s.categoryName,
    categorySlug: s.categoryId,
    tags: s.tags,
    images: s.images.length > 0 ? s.images : [s.mainImage || "https://placehold.co/600x400/6C2BD9/white?text=Service"],
    packages: {
      basic: { name: s.packages.basic.name, description: s.packages.basic.description, price: s.packages.basic.price, deliveryDays: s.packages.basic.deliveryDays, revisions: s.packages.basic.revisions, features: [] },
      standard: { name: s.packages.standard.name, description: s.packages.standard.description, price: s.packages.standard.price, deliveryDays: s.packages.standard.deliveryDays, revisions: s.packages.standard.revisions, features: [] },
      premium: { name: s.packages.premium.name, description: s.packages.premium.description, price: s.packages.premium.price, deliveryDays: s.packages.premium.deliveryDays, revisions: s.packages.premium.revisions, features: [] },
    },
    vendorId: s.userId,
    rating: s.rating,
    reviewCount: s.ratingCount,
    orderCount: s.orderCount,
    featured: s.isBoosted,
    createdAt: s.createdAt,
    faq: s.faq,
  };
}

// ─── Shuffle (Fisher-Yates) ──────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Scoring Algorithm ────────────────────────────────────────────────────────

function computeScore(service: MockService, vendor: MockVendor | undefined): number {
  const salesScore = Math.min(service.orderCount / 500, 1) * 0.25;
  const ratingScore = (service.rating / 5) * 0.20;
  const completionScore = vendor ? (vendor.completionRate / 100) * 0.15 : 0;
  const daysSinceLastSale = Math.max(1, 30 - Math.min(service.orderCount, 30));
  const recencyScore = Math.max(0, 1 - daysSinceLastSale / 90) * 0.10;
  const viewCount = service.reviewCount * 15 + service.orderCount * 8;
  const viewScore = Math.min(viewCount / 5000, 1) * 0.10;
  const responseRate = vendor ? vendor.completionRate / 100 : 0.5;
  const responseScore = responseRate * 0.10;
  const randomScore = Math.random() * 0.10;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newBoost = new Date(service.createdAt) > sevenDaysAgo ? 0.15 : 0;
  return salesScore + ratingScore + completionScore + recencyScore + viewScore + responseScore + randomScore + newBoost;
}

function isSponsored(vendor: MockVendor | undefined): boolean {
  return !!vendor && (vendor.plan === "pro" || vendor.plan === "business" || vendor.plan === "agence");
}

function buildFeedList(services: MockService[], tab: FeedTab): MockService[] {
  if (tab === "pour-vous") {
    // Shuffle then apply scoring for variety
    const shuffled = shuffleArray(services);
    const scored = shuffled.map((s) => ({
      s,
      score: computeScore(s, MOCK_VENDORS.find((v) => v.id === s.vendorId)),
      sponsored: isSponsored(MOCK_VENDORS.find((v) => v.id === s.vendorId)),
    }));
    scored.sort((a, b) => b.score - a.score);

    const result: MockService[] = [];
    const vendorCount: Record<string, number> = {};
    let sponsoredInBatch = 0;

    for (const { s, sponsored } of scored) {
      const batchPos = result.length;
      if (batchPos > 0 && batchPos % 20 === 0) sponsoredInBatch = 0;
      if ((vendorCount[s.vendorId] || 0) >= 4) continue;
      if (sponsored && sponsoredInBatch >= 4) continue;
      result.push(s);
      vendorCount[s.vendorId] = (vendorCount[s.vendorId] || 0) + 1;
      if (sponsored) sponsoredInBatch++;
    }
    return result;
  }

  if (tab === "meilleurs") {
    return shuffleArray(services).sort((a, b) => b.rating - a.rating);
  }

  if (tab === "nouveaux") {
    return shuffleArray(services);
  }

  return shuffleArray(services);
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ service, sponsored, apiVendors }: { service: MockService; sponsored?: boolean; apiVendors?: Map<string, { name: string; avatar: string }> }) {
  const vendor = MOCK_VENDORS.find((v) => v.id === service.vendorId);
  const apiVendor = apiVendors?.get(service.vendorId);
  const vendorName = vendor?.name || apiVendor?.name || "Freelance";
  const vendorAvatar = vendor?.avatar || apiVendor?.avatar || "https://i.pravatar.cc/100";
  const hasTopBadge = vendor?.badges.includes("Top Rated") || false;
  const minPrice = service.packages.basic.price;
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/feed/service/${service.id}`}
      className="group bg-[#1a1f2e] rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-white/5 overflow-hidden">
        {!imgError ? (
          <Image
            src={service.images[0]}
            alt={service.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
            <span className="material-symbols-outlined text-primary text-4xl opacity-50">image</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {sponsored && (
            <span className="bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              Sponsorisé
            </span>
          )}
          {service.featured && !sponsored && (
            <span className="bg-primary/90 text-[#0f1117] text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden">
            <Image
              src={vendorAvatar}
              alt={vendorName}
              width={24}
              height={24}
              className="rounded-full"
              unoptimized
            />
          </div>
          <span className="text-xs text-slate-400 font-medium truncate">{vendorName}</span>
          {hasTopBadge && (
            <span className="material-symbols-outlined text-primary text-xs ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors flex-1">
          {service.title}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={cn("material-symbols-outlined text-sm", star <= Math.round(service.rating) ? "text-yellow-400" : "text-white/10")}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >star</span>
            ))}
          </div>
          <span className="text-xs text-yellow-400 font-semibold">{service.rating.toFixed(1)}</span>
          <span className="text-xs text-slate-500">({service.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <span className="material-symbols-outlined text-sm">shopping_cart</span>
            <span>{service.orderCount}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">À partir de</p>
            <p className="text-base font-bold text-white">{minPrice} EUR</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Filters Panel ────────────────────────────────────────────────────────────

interface Filters {
  priceMin: number;
  priceMax: number;
  rating: number;
  deliveryDays: number;
  vendorType: "all" | "freelance" | "agence";
}

const DEFAULT_FILTERS: Filters = { priceMin: 0, priceMax: 2000, rating: 0, deliveryDays: 0, vendorType: "all" };

function FiltersPanel({ filters, onChange, onClose }: { filters: Filters; onChange: (f: Filters) => void; onClose: () => void }) {
  return (
    <aside className="w-72 flex-shrink-0 bg-[#1a1f2e] border border-white/10 rounded-2xl p-5 h-fit sticky top-36 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Filtres</h3>
        <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-xs text-primary hover:text-primary/80 transition-colors">
          Réinitialiser
        </button>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Budget</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500">Min (EUR)</label>
            <input type="number" value={filters.priceMin} onChange={(e) => onChange({ ...filters, priceMin: +e.target.value })} min={0} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-primary/50" />
          </div>
          <span className="text-slate-500 pt-4">—</span>
          <div className="flex-1">
            <label className="text-[10px] text-slate-500">Max (EUR)</label>
            <input type="number" value={filters.priceMax} onChange={(e) => onChange({ ...filters, priceMax: +e.target.value })} min={0} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-primary/50" />
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Note minimale</p>
        <div className="flex gap-2">
          {[0, 4, 4.5, 4.8].map((r) => (
            <button key={r} onClick={() => onChange({ ...filters, rating: r })} className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors", filters.rating === r ? "bg-primary text-[#0f1117]" : "bg-white/5 text-slate-400 hover:bg-white/10")}>
              {r === 0 ? "Tout" : `${r}+`}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Délai max (jours)</p>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 7, 14, 30].map((d) => (
            <button key={d} onClick={() => onChange({ ...filters, deliveryDays: d })} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", filters.deliveryDays === d ? "bg-primary text-[#0f1117]" : "bg-white/5 text-slate-400 hover:bg-white/10")}>
              {d === 0 ? "Tout" : `${d}j`}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Type de prestataire</p>
        <div className="space-y-2">
          {(["all", "freelance", "agence"] as const).map((type) => (
            <button key={type} onClick={() => onChange({ ...filters, vendorType: type })} className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors", filters.vendorType === type ? "bg-primary/10 text-primary border border-primary/30" : "text-slate-400 hover:bg-white/5 border border-transparent")}>
              <span className="material-symbols-outlined text-lg">{type === "all" ? "groups" : type === "freelance" ? "person" : "apartment"}</span>
              {type === "all" ? "Tous" : type === "freelance" ? "Freelances" : "Agences"}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="w-full py-2.5 bg-primary text-[#0f1117] rounded-xl text-sm font-bold hover:brightness-110 transition-all lg:hidden">
        Appliquer les filtres
      </button>
    </aside>
  );
}

// ─── Welcome Banner ───────────────────────────────────────────────────────────

function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const welcomed = localStorage.getItem("fh_welcomed");
      if (!welcomed) {
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
          localStorage.setItem("fh_welcomed", "1");
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-4 mx-4 lg:mx-6 rounded-2xl bg-gradient-to-r from-primary/25 via-primary/10 to-blue-500/10 border border-primary/20 px-5 py-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">Bienvenue sur FreelanceHigh !</p>
        <p className="text-xs text-slate-300 mt-0.5">Découvrez les meilleurs freelances et agences francophones pour vos projets.</p>
      </div>
      <button onClick={() => { setVisible(false); localStorage.setItem("fh_welcomed", "1"); }} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      <div className="aspect-[16/9] bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/5" />
          <div className="h-3 bg-white/5 rounded flex-1" />
        </div>
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-px bg-white/5" />
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-5 w-12 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial Banner ──────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Aminata D.",
    role: "CEO, AgriTech Sénégal",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "FreelanceHigh m\u2019a permis de trouver un développeur mobile en 48h. La qualité du travail livré a dépassé mes attentes !",
    rating: 5,
  },
  {
    name: "Jean-Pierre K.",
    role: "Freelance Full-Stack",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Depuis que je suis sur FreelanceHigh, mes revenus ont augmenté de 40%. La plateforme connecte vraiment les talents avec les bons clients.",
    rating: 5,
  },
  {
    name: "Fatou B.",
    role: "Directrice Marketing, Abidjan",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    text: "L\u2019escrow sécurisé et la messagerie intégrée rendent la collaboration fluide et sans stress. Je recommande à 100% !",
    rating: 5,
  },
];

function TestimonialBanner() {
  const testimonial = TESTIMONIALS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % TESTIMONIALS.length];

  return (
    <div className="col-span-full my-2">
      <div className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-primary/10 border border-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30">
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              width={56}
              height={56}
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={cn("material-symbols-outlined text-sm", star <= testimonial.rating ? "text-yellow-400" : "text-white/10")}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >star</span>
            ))}
          </div>
          <p className="text-sm text-slate-200 italic leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
          <div className="mt-2">
            <p className="text-xs font-semibold text-white">{testimonial.name}</p>
            <p className="text-[11px] text-slate-500">{testimonial.role}</p>
          </div>
        </div>
        <div className="flex-shrink-0 hidden md:flex flex-col items-center gap-1">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
          <span className="text-[10px] text-slate-500 font-medium">Témoignage vérifié</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Feed Page ───────────────────────────────────────────────────────────

function FeedPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("categorie") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [activeTab, setActiveTab] = useState<FeedTab>("pour-vous");
  const [sort, setSort] = useState("pertinence");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Fetch real services from API
  const [apiServices, setApiServices] = useState<MockService[]>([]);
  const [apiVendors, setApiVendors] = useState<Map<string, { name: string; avatar: string }>>(new Map());
  useEffect(() => {
    fetch("/api/feed")
      .then((res) => res.ok ? res.json() : { services: [] })
      .then((data: { services: ApiService[] }) => {
        if (data.services && data.services.length > 0) {
          setApiServices(data.services.map(mapApiToMock));
          // Build vendor map from API services
          const vendorMap = new Map<string, { name: string; avatar: string }>();
          for (const s of data.services) {
            if (!vendorMap.has(s.userId)) {
              vendorMap.set(s.userId, {
                name: s.vendorName || "Freelance",
                avatar: s.vendorAvatar || "https://i.pravatar.cc/100",
              });
            }
          }
          setApiVendors(vendorMap);
        }
      })
      .catch(() => { /* fallback to mock data only */ });
  }, []);

  // Shuffle on each page load via key
  const [shuffleKey] = useState(() => Math.random());

  // Merge API services (real, at the top) + expanded mock services
  const allServices = useMemo(() => {
    const apiIds = new Set(apiServices.map((s) => s.id));
    const mockWithoutDuplicates = EXPANDED_SERVICES.filter((s) => !apiIds.has(s.id));
    return [...apiServices, ...mockWithoutDuplicates];
  }, [apiServices]);

  // Filter services
  const filteredServices = useMemo(() => {
    let list = allServices;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.shortDesc.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (categorySlug) {
      list = list.filter((s) => s.categorySlug === categorySlug);
    }

    list = list.filter((s) => {
      const price = s.packages.basic.price;
      return price >= filters.priceMin && price <= filters.priceMax;
    });

    if (filters.rating > 0) list = list.filter((s) => s.rating >= filters.rating);
    if (filters.deliveryDays > 0) list = list.filter((s) => s.packages.basic.deliveryDays <= filters.deliveryDays);
    if (filters.vendorType !== "all") {
      list = list.filter((s) => {
        const vendor = MOCK_VENDORS.find((v) => v.id === s.vendorId);
        return vendor?.type === filters.vendorType;
      });
    }

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categorySlug, filters, shuffleKey]);

  // Apply tab ordering
  const tabOrdered = useMemo(() => {
    if (query || categorySlug) {
      switch (sort) {
        case "prix-asc": return [...filteredServices].sort((a, b) => a.packages.basic.price - b.packages.basic.price);
        case "prix-desc": return [...filteredServices].sort((a, b) => b.packages.basic.price - a.packages.basic.price);
        case "note": return [...filteredServices].sort((a, b) => b.rating - a.rating);
        case "nouveaute": return [...filteredServices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        case "popularite": return [...filteredServices].sort((a, b) => b.orderCount - a.orderCount);
        default: return buildFeedList(filteredServices, "pour-vous");
      }
    }
    return buildFeedList(filteredServices, activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredServices, activeTab, sort]);

  // Pagination
  const totalPages = Math.ceil(tabOrdered.length / SERVICES_PER_PAGE);
  const startIndex = (currentPage - 1) * SERVICES_PER_PAGE;
  const displayedServices = tabOrdered.slice(startIndex, startIndex + SERVICES_PER_PAGE);
  const hasMore = currentPage < totalPages;

  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    router.push(`/feed${qs ? `?${qs}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, router]);

  // Split services for testimonial banner insertion after ~20 items
  const TESTIMONIAL_INDEX = 20;
  const beforeTestimonial = displayedServices.slice(0, TESTIMONIAL_INDEX);
  const afterTestimonial = displayedServices.slice(TESTIMONIAL_INDEX);

  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug);

  const tabs: { id: FeedTab; label: string; icon: string }[] = [
    { id: "pour-vous", label: "Pour vous", icon: "recommend" },
    { id: "meilleurs", label: "Meilleurs services", icon: "workspace_premium" },
    { id: "nouveaux", label: "Nouveaux", icon: "fiber_new" },
  ];

  return (
    <div>
      <CategoryBar />

      {/* Welcome banner — first visit only */}
      <WelcomeBanner />

      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4">
        {/* Tabs — only when no search/category filter active */}
        {!query && !categorySlug && (
          <div className="flex items-center gap-1 mb-4 bg-white/5 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); goToPage(1); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-[#0f1117] shadow-md shadow-primary/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <span className="material-symbols-outlined text-base" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">
              {query ? `Résultats pour "${query}"` : activeCategory ? activeCategory.label : "Tous les services"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {tabOrdered.length} service{tabOrdered.length !== 1 ? "s" : ""} disponible{tabOrdered.length !== 1 ? "s" : ""}
              {totalPages > 1 && (
                <span className="ml-2">— Page {currentPage} sur {totalPages}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors lg:hidden",
                showFilters ? "bg-primary/10 text-primary" : "bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Filtres
            </button>
            {(query || categorySlug) && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1a1f2e]">{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters desktop */}
          <div className="hidden lg:block">
            <FiltersPanel filters={filters} onChange={setFilters} onClose={() => {}} />
          </div>

          {/* Filters mobile */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setShowFilters(false)}>
              <div className="absolute left-0 top-0 h-full w-80 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
                <FiltersPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
              </div>
            </div>
          )}

          {/* Services grid */}
          <div className="flex-1 min-w-0">
            {displayedServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">search_off</span>
                <h3 className="text-lg font-semibold text-white mb-2">Aucun résultat</h3>
                <p className="text-sm text-slate-500 max-w-sm">Essayez d&apos;autres termes de recherche ou supprimez certains filtres.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {beforeTestimonial.map((service, index) => {
                    const vendor = MOCK_VENDORS.find((v) => v.id === service.vendorId);
                    const sp = activeTab === "pour-vous" && !query && !categorySlug && isSponsored(vendor);
                    return (
                      <ServiceCard key={`${service.id}-${index}`} service={service} sponsored={sp} apiVendors={apiVendors} />
                    );
                  })}
                  {displayedServices.length > TESTIMONIAL_INDEX && <TestimonialBanner />}
                  {afterTestimonial.map((service, index) => {
                    const vendor = MOCK_VENDORS.find((v) => v.id === service.vendorId);
                    const sp = activeTab === "pour-vous" && !query && !categorySlug && isSponsored(vendor);
                    return (
                      <ServiceCard key={`${service.id}-after-${index}`} service={service} sponsored={sp} apiVendors={apiVendors} />
                    );
                  })}
                </div>

                {/* Pagination — Voir plus de services */}
                <div className="mt-10 flex flex-col items-center gap-6">
                  {hasMore && (
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      className="flex items-center gap-3 px-10 py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      Voir plus de services
                      <span className="text-xs opacity-70 ml-1">
                        ({tabOrdered.length - (startIndex + SERVICES_PER_PAGE)} restants)
                      </span>
                    </button>
                  )}

                  {/* Page indicator */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                          currentPage <= 1 ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>

                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={cn(
                              "w-9 h-9 rounded-lg text-sm font-semibold transition-colors",
                              page === currentPage
                                ? "bg-primary text-[#0f1117]"
                                : "text-slate-400 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                          currentPage >= totalPages ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  )}

                  {!hasMore && tabOrdered.length > 0 && (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                      </div>
                      <p className="text-sm font-semibold text-white">Vous avez tout vu !</p>
                      <p className="text-xs text-slate-500">De nouveaux services arrivent bientôt.</p>
                      {currentPage > 1 && (
                        <button
                          onClick={() => goToPage(1)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                        >
                          Revenir à la première page
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement du feed...</p>
        </div>
      </div>
    }>
      <FeedPageInner />
    </Suspense>
  );
}
