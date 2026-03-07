"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  getServiceById,
  getVendorById,
  getReviewsByService,
  getSimilarServices,
} from "@/lib/dev/mock-data";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const service = getServiceById(id);

  if (!service) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-600">search_off</span>
        <h1 className="text-xl font-bold text-white">Service introuvable</h1>
        <Link href="/feed" className="text-primary hover:underline text-sm">
          Retour au feed
        </Link>
      </div>
    );
  }

  const vendor = getVendorById(service.vendorId);
  const reviews = getReviewsByService(service.id);
  const similar = getSimilarServices(service, 4);

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/feed" className="hover:text-primary transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <Link
            href={`/feed?categorie=${service.categorySlug}`}
            className="hover:text-primary transition-colors"
          >
            {service.category}
          </Link>
          <span>/</span>
          <span className="text-slate-300 truncate max-w-xs">{service.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Colonne gauche (contenu) ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">
            <ServiceGallery service={service} />
            <ServiceDescription service={service} />
            <ServiceFaq service={service} />
            <ServiceReviews reviews={reviews} rating={service.rating} reviewCount={service.reviewCount} />
          </div>

          {/* ─── Colonne droite (sticky) ──────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <PackagesCard service={service} session={session} />
              {vendor && <VendorCard vendor={vendor} serviceVendorType={vendor.type} session={session} />}
            </div>
          </div>
        </div>

        {/* Services similaires */}
        {similar.length > 0 && (
          <SimilarServices services={similar} />
        )}
      </div>
    </div>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

function ServiceGallery({ service }: { service: ReturnType<typeof getServiceById> }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  if (!service) return null;

  return (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold text-white mb-4 leading-tight">
        {service.title}
      </h1>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {service.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Image principale */}
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-white/5 mb-3">
        {!imgErrors[activeIndex] ? (
          <Image
            src={service.images[activeIndex]}
            alt={service.title}
            fill
            className="object-cover"
            onError={() => setImgErrors((e) => ({ ...e, [activeIndex]: true }))}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
            <span className="material-symbols-outlined text-primary/30 text-6xl">image</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {service.images.length > 1 && (
        <div className="flex gap-2">
          {service.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors",
                i === activeIndex ? "border-primary" : "border-transparent hover:border-white/20"
              )}
            >
              <Image
                src={img}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover"
                onError={() => {}}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
        <div className="flex items-center gap-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={cn(
                  "material-symbols-outlined text-base",
                  s <= Math.round(service.rating) ? "text-yellow-400" : "text-white/10"
                )}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
          <span className="font-semibold text-yellow-400">{service.rating.toFixed(1)}</span>
          <span>({service.reviewCount} avis)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">shopping_cart</span>
          {service.orderCount} commandes
        </div>
      </div>
    </div>
  );
}

// ─── Description ─────────────────────────────────────────────────────────────

function ServiceDescription({ service }: { service: ReturnType<typeof getServiceById> }) {
  if (!service) return null;
  return (
    <div>
      <h2 className="text-base font-bold text-white mb-3">À propos de ce service</h2>
      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {service.description}
      </div>
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function ServiceFaq({ service }: { service: ReturnType<typeof getServiceById> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!service || service.faq.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-bold text-white mb-3">Questions fréquentes</h2>
      <div className="space-y-2">
        {service.faq.map((item, i) => (
          <div
            key={i}
            className="border border-white/10 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-white hover:bg-white/5 transition-colors"
            >
              <span>{item.question}</span>
              <span
                className={cn(
                  "material-symbols-outlined text-slate-400 text-lg transition-transform",
                  openIndex === i ? "rotate-180" : "rotate-0"
                )}
              >
                expand_more
              </span>
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

function ServiceReviews({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: ReturnType<typeof getReviewsByService>;
  rating: number;
  reviewCount: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-bold text-white">Avis clients</h2>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="text-sm font-bold text-white">{rating.toFixed(1)}</span>
          <span className="text-xs text-slate-500">({reviewCount} avis)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun avis pour l&apos;instant.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                  <Image
                    src={review.reviewer.avatar}
                    alt={review.reviewer.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                    onError={() => {}}
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{review.reviewer.name}</span>
                      <span className="text-base">{review.reviewer.flag}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={cn(
                            "material-symbols-outlined text-sm",
                            s <= review.rating ? "text-yellow-400" : "text-white/10"
                          )}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">{review.comment}</p>
                  {review.response && (
                    <div className="mt-3 pl-3 border-l-2 border-primary/40">
                      <p className="text-xs text-primary font-semibold mb-1">Réponse du vendeur</p>
                      <p className="text-xs text-slate-400">{review.response}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-600 mt-2">
                    {new Date(review.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Packages Card ───────────────────────────────────────────────────────────

function PackagesCard({
  service,
  session,
}: {
  service: ReturnType<typeof getServiceById>;
  session: ReturnType<typeof useSession>["data"];
}) {
  const [activeTab, setActiveTab] = useState<"basic" | "standard" | "premium">("standard");
  if (!service) return null;

  const pkg = service.packages[activeTab];
  const tabConfig: { key: "basic" | "standard" | "premium"; label: string }[] = [
    { key: "basic", label: "Basique" },
    { key: "standard", label: "Standard" },
    { key: "premium", label: "Premium" },
  ];

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabConfig.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              activeTab === key
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-slate-500 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Package content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">{pkg.name}</p>
            <p className="text-sm text-slate-300">{pkg.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">€{pkg.price}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            {pkg.deliveryDays} jour{pkg.deliveryDays > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">refresh</span>
            {pkg.revisions} révision{pkg.revisions > 1 ? "s" : ""}
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-5">
          {pkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">check</span>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {session ? (
          <button className="w-full py-3 bg-primary text-[#0f1117] font-bold rounded-xl hover:brightness-110 transition-all text-sm shadow-lg shadow-primary/20">
            Commander maintenant — €{pkg.price}
          </button>
        ) : (
          <Link
            href={`/inscription?callbackUrl=/feed/service/${service.id}`}
            className="flex items-center justify-center w-full py-3 bg-primary text-[#0f1117] font-bold rounded-xl hover:brightness-110 transition-all text-sm"
          >
            Inscrivez-vous pour commander
          </Link>
        )}

        {session && (
          <button className="w-full py-2.5 mt-2 border border-white/10 text-slate-300 text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors">
            Contacter le vendeur
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Vendor Card ─────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  serviceVendorType,
  session,
}: {
  vendor: ReturnType<typeof getVendorById>;
  serviceVendorType: "freelance" | "agence";
  session: ReturnType<typeof useSession>["data"];
}) {
  if (!vendor) return null;
  const profileHref =
    serviceVendorType === "agence"
      ? `/agencies/${vendor.id}`
      : `/freelancers/${vendor.id}`;

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {serviceVendorType === "agence" ? "Agence" : "Freelance"}
      </p>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
          <Image
            src={vendor.avatar}
            alt={vendor.name}
            width={48}
            height={48}
            className="rounded-full"
            onError={() => {}}
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={profileHref} className="text-sm font-bold text-white hover:text-primary transition-colors">
            {vendor.name}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{vendor.title}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {vendor.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-center">
        <div className="bg-white/5 rounded-xl p-2.5">
          <p className="text-base font-bold text-white">{vendor.rating.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500">Note</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5">
          <p className="text-base font-bold text-white">{vendor.completionRate}%</p>
          <p className="text-[10px] text-slate-500">Completion</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5">
          <p className="text-base font-bold text-white">{vendor.responseTime}</p>
          <p className="text-[10px] text-slate-500">Réponse</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2.5">
          <p className="text-base font-bold text-white">{vendor.totalOrders}</p>
          <p className="text-[10px] text-slate-500">Commandes</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={profileHref}
          className="flex-1 py-2.5 border border-white/10 text-slate-300 text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors text-center"
        >
          Voir le profil
        </Link>
        {session && (
          <button className="flex-1 py-2.5 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-colors">
            Contacter
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Similar Services ────────────────────────────────────────────────────────

function SimilarServices({ services }: { services: ReturnType<typeof getSimilarServices> }) {
  return (
    <div className="mt-12">
      <h2 className="text-base font-bold text-white mb-4">Services similaires</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((s) => {
          const vendor = getVendorById(s.vendorId);
          return (
            <Link
              key={s.id}
              href={`/feed/service/${s.id}`}
              className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-colors"
            >
              <div className="relative aspect-[16/9] bg-white/5">
                <Image src={s.images[0]} alt={s.title} fill className="object-cover" onError={() => {}} unoptimized />
              </div>
              <div className="p-3">
                {vendor && (
                  <p className="text-[11px] text-slate-500 mb-1">{vendor.name}</p>
                )}
                <p className="text-xs font-semibold text-white line-clamp-2 mb-2">{s.title}</p>
                <p className="text-sm font-bold text-white">À partir de €{s.packages.basic.price}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
