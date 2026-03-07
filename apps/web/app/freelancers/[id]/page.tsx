"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  getVendorById,
  getServicesByVendor,
  MOCK_REVIEWS,
} from "@/lib/dev/mock-data";

type Tab = "services" | "portfolio" | "avis";

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const vendor = getVendorById(id);
  const [activeTab, setActiveTab] = useState<Tab>("services");

  if (!vendor || vendor.type !== "freelance") {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-600">person_off</span>
        <h1 className="text-xl font-bold text-white">Profil introuvable</h1>
        <Link href="/feed" className="text-primary hover:underline text-sm">
          Retour au feed
        </Link>
      </div>
    );
  }

  const services = getServicesByVendor(vendor.id);
  const reviews = MOCK_REVIEWS.filter((r) => services.some((s) => s.id === r.serviceId));
  const memberSinceYear = vendor.memberSince.split("-")[0];

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#1a1f2e] to-[#0f1117] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/20 flex-shrink-0 border-2 border-primary/30">
              <Image
                src={vendor.avatar}
                alt={vendor.name}
                width={96}
                height={96}
                className="rounded-2xl"
                onError={() => {}}
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
                  <p className="text-primary font-medium mt-0.5">{vendor.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span>{vendor.location}</span>
                  </div>
                </div>

                {session && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-[#0f1117] font-bold rounded-xl hover:brightness-110 transition-all text-sm">
                    <span className="material-symbols-outlined text-lg">chat_bubble</span>
                    Contacter
                  </button>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {vendor.badges.map((badge) => (
                  <span
                    key={badge}
                    className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {badge}
                  </span>
                ))}
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold text-white">{vendor.rating.toFixed(1)}</span>
                  <span className="text-slate-500">({vendor.reviewCount} avis)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  Répond en {vendor.responseTime}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  {vendor.completionRate}% de completion
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Membre depuis {memberSinceYear}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-6">
              {([
                { key: "services", label: "Services", count: services.length },
                { key: "portfolio", label: "Portfolio", count: vendor.portfolioImages?.length || 0 },
                { key: "avis", label: "Avis", count: reviews.length },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-white"
                  )}
                >
                  {label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    activeTab === key ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-400"
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Services tab */}
            {activeTab === "services" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun service publié.</p>
                ) : (
                  services.map((service) => (
                    <Link
                      key={service.id}
                      href={`/feed/service/${service.id}`}
                      className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-colors flex flex-col"
                    >
                      <div className="relative aspect-[16/9] bg-white/5">
                        <Image
                          src={service.images[0]}
                          alt={service.title}
                          fill
                          className="object-cover"
                          onError={() => {}}
                          unoptimized
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <p className="text-sm font-semibold text-white line-clamp-2 flex-1 mb-2">
                          {service.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-xs text-yellow-400 font-semibold">{service.rating.toFixed(1)}</span>
                            <span className="text-xs text-slate-500">({service.reviewCount})</span>
                          </div>
                          <span className="text-sm font-bold text-white">€{service.packages.basic.price}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Portfolio tab */}
            {activeTab === "portfolio" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(vendor.portfolioImages || []).map((img, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
                    <Image
                      src={img}
                      alt={`Portfolio ${i + 1}`}
                      fill
                      className="object-cover"
                      onError={() => {}}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Avis tab */}
            {activeTab === "avis" && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun avis pour l&apos;instant.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-[#1a1f2e] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={review.reviewer.avatar}
                            alt={review.reviewer.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                            onError={() => {}}
                            unoptimized
                          />
                          <span className="text-sm font-semibold text-white">{review.reviewer.name}</span>
                          <span>{review.reviewer.flag}</span>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={cn("material-symbols-outlined text-sm", s <= review.rating ? "text-yellow-400" : "text-white/10")} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            {/* Bio */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">À propos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{vendor.bio}</p>
            </div>

            {/* Compétences */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Compétences</h3>
              <div className="flex flex-wrap gap-1.5">
                {vendor.skills.map((skill) => (
                  <span key={skill} className="text-xs bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Statistiques</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Commandes livrées</span>
                  <span className="text-white font-semibold">{vendor.totalOrders}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Services actifs</span>
                  <span className="text-white font-semibold">{vendor.totalServices}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Tarif horaire</span>
                  <span className="text-white font-semibold">€{vendor.hourlyRate || "N/A"}/h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Langues</span>
                  <span className="text-white font-semibold">{vendor.languages.join(", ")}</span>
                </div>
              </div>
            </div>

            {!session && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-300 mb-3">Inscrivez-vous pour contacter ce freelance et passer commande.</p>
                <Link
                  href="/inscription"
                  className="flex items-center justify-center w-full py-2.5 bg-primary text-[#0f1117] font-bold rounded-xl text-sm hover:brightness-110 transition-all"
                >
                  S&apos;inscrire gratuitement
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
