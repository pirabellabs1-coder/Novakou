"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";
import { formatServiceTitle } from "@/lib/format-service-title";
import { useCurrencyStore } from "@/store/currency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MarketplaceService = {
  id: string;
  slug: string;
  title: string;
  sellerName: string;
  sellerType: "freelance" | "agence";
  rating: number;
  reviewsCount: number;
  orderCount: number;
  price: number;
  deliveryDays: number;
  tags: string[];
  category: string;
  categoryIcon: string;
  image: string;
  vendorAvatar: string;
};

type ClientOffer = {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  skills: string[];
  urgency: "normale" | "urgente" | "tres_urgente";
  proposalsCount: number;
  clientName: string;
  clientCountry: string;
};

type Agency = {
  id: string;
  name: string;
  description: string;
  rating: number;
  membersCount: number;
  specialities: string[];
  country: string;
  countryFlag: string;
  verified: boolean;
};

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

// Data is fetched from API on mount — no more hardcoded demos

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIEW_TABS = [
  { key: "services", label: "Services", icon: "storefront" },
  { key: "offres", label: "Offres Clients", icon: "work" },
  { key: "agences", label: "Agences", icon: "business" },
] as const;

type ViewTab = (typeof VIEW_TABS)[number]["key"];

const SERVICE_CATEGORIES = [
  { label: "Toutes", value: "all", icon: "apps" },
  { label: "Developpement", value: "Developpement", icon: "code" },
  { label: "Design", value: "Design", icon: "palette" },
  { label: "Marketing", value: "Marketing", icon: "campaign" },
  { label: "Redaction", value: "Redaction", icon: "edit_note" },
  { label: "Video", value: "Video", icon: "videocam" },
  { label: "Data & IA", value: "Data & IA", icon: "analytics" },
];

const URGENCY_CONFIG = {
  normale: { label: "Normale", className: "bg-slate-500/10 text-slate-400" },
  urgente: { label: "Urgent", className: "bg-amber-500/10 text-amber-400" },
  tres_urgente: { label: "Tres urgent", className: "bg-red-500/10 text-red-400" },
};

const FLAG: Record<string, string> = {
  CI: "\uD83C\uDDE8\uD83C\uDDEE",
  SN: "\uD83C\uDDF8\uD83C\uDDF3",
  CM: "\uD83C\uDDE8\uD83C\uDDF2",
  FR: "\uD83C\uDDEB\uD83C\uDDF7",
  ML: "\uD83C\uDDF2\uD83C\uDDF1",
  BJ: "\uD83C\uDDE7\uD83C\uDDEF",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <span
          key={`f-${i}`}
          className="material-symbols-outlined text-amber-400"
          style={{ fontSize: size, fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
      {hasHalf && (
        <span
          className="material-symbols-outlined text-amber-400"
          style={{ fontSize: size, fontVariationSettings: "'FILL' 1" }}
        >
          star_half
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <span
          key={`e-${i}`}
          className="material-symbols-outlined text-slate-600"
          style={{ fontSize: size }}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service Card
// ---------------------------------------------------------------------------

function ServiceCard({
  service,
  onContact,
}: {
  service: MarketplaceService;
  onContact: (name: string) => void;
}) {
  return (
    <div className="group flex flex-col rounded-2xl bg-background-dark/50 border border-border-dark hover:border-primary/40 transition-all overflow-hidden">
      {/* Image */}
      <div className="relative h-40 bg-neutral-dark flex items-center justify-center overflow-hidden">
        {service.image ? (
          <img src={service.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 20px, rgb(var(--color-primary)) 20px, rgb(var(--color-primary)) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgb(var(--color-primary)) 20px, rgb(var(--color-primary)) 21px)",
              }}
            />
            <span className="material-symbols-outlined text-primary/20 text-[56px]">
              {service.categoryIcon}
            </span>
          </>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background-dark/80 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          <span className="material-symbols-outlined text-primary text-[14px]">
            {service.categoryIcon}
          </span>
          <span className="text-[11px] font-bold text-slate-300">{service.category}</span>
        </div>
        {/* Seller type badge */}
        <div
          className={cn(
            "absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
            service.sellerType === "agence"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-primary/20 text-primary"
          )}
        >
          {service.sellerType === "agence" ? "Agence" : "Freelance"}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Seller name */}
        <div className="flex items-center gap-2 mb-2">
          {service.vendorAvatar ? (
            <img src={service.vendorAvatar} alt={service.sellerName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" loading="lazy" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[14px]">person</span>
            </div>
          )}
          <span className="text-xs font-semibold text-slate-400 truncate">
            {service.sellerName}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
          {formatServiceTitle(service.title)}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {service.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Rating + Sales */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <StarRating rating={service.rating} size={12} />
          <span className="text-xs font-bold text-slate-300">{service.rating.toFixed(1)}</span>
          <span className="text-[11px] text-slate-500">({service.reviewsCount} avis)</span>
          {service.orderCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="material-symbols-outlined text-emerald-500 text-sm">shopping_bag</span>
              <span className="font-semibold">{service.orderCount} {service.orderCount > 1 ? "ventes" : "vente"}</span>
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: price + delivery */}
        <div className="flex items-center justify-between pt-3 border-t border-border-dark mb-3">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-slate-500 text-[14px]">schedule</span>
            <span className="text-[11px] text-slate-500">{service.deliveryDays}j</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-slate-500">A partir de</span>
            <span className="text-lg font-black text-primary ml-1">{service.price}</span>
            <span className="text-xs font-bold text-primary">&euro;</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/services/${service.slug || service.id}`}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Voir
          </Link>
          <button
            onClick={() => onContact(service.sellerName)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
              "border border-border-dark text-slate-300 hover:border-primary/40 hover:text-primary"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Contacter
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Offer Card
// ---------------------------------------------------------------------------

function OfferCard({
  offer,
  onApply,
}: {
  offer: ClientOffer;
  onApply: (offer: ClientOffer) => void;
}) {
  const urgency = URGENCY_CONFIG[offer.urgency];

  return (
    <div className="group flex flex-col md:flex-row items-stretch gap-5 p-5 rounded-2xl bg-background-dark/50 border border-border-dark hover:border-primary/40 transition-all">
      {/* Left icon area */}
      <div className="hidden md:flex w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-dark">
        <span className="material-symbols-outlined text-primary/30 text-[40px]">work</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-100 group-hover:text-primary transition-colors leading-snug line-clamp-1">
              {offer.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>{FLAG[offer.clientCountry] ?? ""} {offer.clientName}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {offer.deadline}
              </span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group</span>
                {offer.proposalsCount} propositions
              </span>
            </div>
          </div>

          {/* Urgency badge + budget */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                urgency.className
              )}
            >
              {urgency.label}
            </span>
            <span className="text-primary font-black text-sm whitespace-nowrap">
              {(offer.budgetMin ?? 0).toLocaleString("fr-FR")}&euro; &ndash;{" "}
              {(offer.budgetMax ?? 0).toLocaleString("fr-FR")}&euro;
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{offer.description}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {offer.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border-dark">
          <button
            className={cn(
              "flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold transition-all",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Voir details
          </button>
          <button
            onClick={() => onApply(offer)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold transition-all",
              "bg-primary text-white hover:opacity-90 shadow-sm shadow-primary/20"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Postuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agency Card
// ---------------------------------------------------------------------------

function AgencyCard({
  agency,
  onContact,
}: {
  agency: Agency;
  onContact: (name: string) => void;
}) {
  return (
    <div className="group flex flex-col rounded-2xl bg-background-dark/50 border border-border-dark hover:border-primary/40 transition-all overflow-hidden">
      {/* Header area */}
      <div className="relative h-28 bg-neutral-dark flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, rgb(var(--color-primary)), transparent 60%)",
          }}
        />
        <div className="w-16 h-16 rounded-2xl bg-background-dark/80 backdrop-blur-sm border border-border-dark flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[28px]">business</span>
        </div>
        {agency.verified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-md">
            <span
              className="material-symbols-outlined text-primary text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-[10px] font-bold text-primary">Verifiee</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Name + country */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-primary transition-colors">
            {agency.name}
          </h3>
          <span className="text-sm" title={agency.country}>
            {FLAG[agency.countryFlag] ?? ""}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
          {agency.description}
        </p>

        {/* Rating + Members */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <StarRating rating={agency.rating} size={12} />
            <span className="text-xs font-bold text-slate-300">{agency.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[14px]">group</span>
            <span>{agency.membersCount} membres</span>
          </div>
        </div>

        {/* Specialities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agency.specialities.map((spec) => (
            <span
              key={spec}
              className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full"
            >
              {spec}
            </span>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border-dark">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
              "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Voir profil
          </button>
          <button
            onClick={() => onContact(agency.name)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
              "border border-border-dark text-slate-300 hover:border-primary/40 hover:text-primary"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Contacter
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Modal
// ---------------------------------------------------------------------------

function ContactModal({
  open,
  recipientName,
  onClose,
  onSend,
}: {
  open: boolean;
  recipientName: string;
  onClose: () => void;
  onSend: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  if (!open) return null;

  function handleSend() {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background-dark border border-border-dark rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">chat</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Contacter</h3>
              <p className="text-xs text-slate-500">{recipientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="block text-xs font-bold text-slate-400 mb-2">Votre message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Bonjour, je suis interesse par vos services..."
            rows={5}
            className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-slate-500"
          />
          <p className="text-[11px] text-slate-600 mt-1.5">
            Le destinataire recevra votre message dans sa messagerie FreelanceHigh.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border-dark text-sm font-bold text-slate-400 hover:bg-primary/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={cn(
              "flex-1 h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              message.trim()
                ? "bg-primary text-white hover:opacity-90 shadow-sm shadow-primary/20"
                : "bg-neutral-dark text-slate-600 cursor-not-allowed"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apply Modal
// ---------------------------------------------------------------------------

function ApplyModal({
  open,
  offer,
  onClose,
  onSubmit,
}: {
  open: boolean;
  offer: ClientOffer | null;
  onClose: () => void;
  onSubmit: (data: { coverLetter: string; proposedPrice: string; proposedDeadline: string }) => void;
}) {
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedDeadline, setProposedDeadline] = useState("");

  if (!open || !offer) return null;

  function handleSubmit() {
    if (!coverLetter.trim() || !proposedPrice.trim() || !proposedDeadline.trim()) return;
    onSubmit({
      coverLetter: coverLetter.trim(),
      proposedPrice: proposedPrice.trim(),
      proposedDeadline: proposedDeadline.trim(),
    });
    setCoverLetter("");
    setProposedPrice("");
    setProposedDeadline("");
  }

  const isValid = coverLetter.trim() && proposedPrice.trim() && proposedDeadline.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-background-dark border border-border-dark rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark sticky top-0 bg-background-dark z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">send</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Postuler a cette offre</h3>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-[280px]">{offer.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Offer summary */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-neutral-dark border border-border-dark">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Budget client</span>
            <span className="font-bold text-primary">
              {(offer.budgetMin ?? 0).toLocaleString("fr-FR")}&euro; &ndash;{" "}
              {(offer.budgetMax ?? 0).toLocaleString("fr-FR")}&euro;
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
            <span>Delai souhaite</span>
            <span className="font-semibold text-slate-300">{offer.deadline}</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Cover letter */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Lettre de motivation *
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Expliquez pourquoi vous etes le meilleur candidat pour ce projet, votre experience pertinente, votre approche..."
              rows={5}
              className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-slate-500"
            />
          </div>

          {/* Proposed price + deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Prix propose (&euro;) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="Ex: 3000"
                  className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  &euro;
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Delai propose *
              </label>
              <input
                type="text"
                value={proposedDeadline}
                onChange={(e) => setProposedDeadline(e.target.value)}
                placeholder="Ex: 25 jours"
                className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border-dark text-sm font-bold text-slate-400 hover:bg-primary/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "flex-1 h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              isValid
                ? "bg-primary text-white hover:opacity-90 shadow-sm shadow-primary/20"
                : "bg-neutral-dark text-slate-600 cursor-not-allowed"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Envoyer la candidature
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

// Map API category icon
const CATEGORY_ICON_MAP: Record<string, string> = {
  "Developpement": "code",
  "Développement Web": "code",
  "Développement": "code",
  "Design": "palette",
  "Design UI/UX": "palette",
  "Marketing": "campaign",
  "Marketing Digital": "campaign",
  "Redaction": "edit_note",
  "Rédaction": "edit_note",
  "Video": "videocam",
  "Data & IA": "analytics",
};

function getCategoryIcon(categoryName: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "category";
}

export default function ExplorerPage() {
  const addToast = useToastStore((s) => s.addToast);
  const { format } = useCurrencyStore();

  // View state
  const [activeView, setActiveView] = useState<ViewTab>("services");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // API-fetched data
  const [apiServices, setApiServices] = useState<MarketplaceService[]>([]);
  const [apiOffers, setApiOffers] = useState<ClientOffer[]>([]);
  const [apiAgencies, setApiAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch services from the public API
  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/public/services?limit=50");
      if (res.ok) {
        const data = await res.json();
        const services: MarketplaceService[] = (data.services || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          slug: s.slug as string || "",
          title: s.title as string || "",
          sellerName: s.vendorName as string || "Freelance",
          sellerType: ((s.vendorBadges as string[]) || []).includes("Agence") ? "agence" as const : "freelance" as const,
          rating: Number(s.rating) || 0,
          reviewsCount: Number(s.ratingCount) || 0,
          orderCount: Number(s.orderCount) || 0,
          price: Number(s.basePrice) || 0,
          deliveryDays: Number(s.deliveryDays) || 0,
          tags: (s.tags as string[]) || [],
          category: s.category as string || "",
          categoryIcon: getCategoryIcon(s.category as string || ""),
          image: s.image as string || "",
          vendorAvatar: s.vendorAvatar as string || "",
        }));
        setApiServices(services);
      }
    } catch (err) {
      console.error("[Explorer] Failed to fetch services:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Modals
  const [contactModal, setContactModal] = useState<{ open: boolean; name: string }>({
    open: false,
    name: "",
  });
  const [applyModal, setApplyModal] = useState<{ open: boolean; offer: ClientOffer | null }>({
    open: false,
    offer: null,
  });

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------

  const filteredServices = useMemo(() => {
    let result = apiServices;
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.sellerName.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedCategory, apiServices]);

  const filteredOffers = useMemo(() => {
    if (!search) return apiOffers;
    const q = search.toLowerCase();
    return apiOffers.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [search, apiOffers]);

  const filteredAgencies = useMemo(() => {
    if (!search) return apiAgencies;
    const q = search.toLowerCase();
    return apiAgencies.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.specialities.some((s) => s.toLowerCase().includes(q))
    );
  }, [search, apiAgencies]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleContactSend(message: string) {
    setContactModal({ open: false, name: "" });
    addToast("success", `Message envoye a ${contactModal.name}`);
  }

  function handleApplySubmit(data: {
    coverLetter: string;
    proposedPrice: string;
    proposedDeadline: string;
  }) {
    setApplyModal({ open: false, offer: null });
    addToast("success", "Candidature envoyee avec succes !");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Modals */}
      <ContactModal
        open={contactModal.open}
        recipientName={contactModal.name}
        onClose={() => setContactModal({ open: false, name: "" })}
        onSend={handleContactSend}
      />
      <ApplyModal
        open={applyModal.open}
        offer={applyModal.offer}
        onClose={() => setApplyModal({ open: false, offer: null })}
        onSubmit={handleApplySubmit}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">
          Explorer le marche
        </h1>
        <p className="text-sm text-slate-400">
          Decouvrez les services, offres clients et agences de la marketplace FreelanceHigh
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* View tabs                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1 bg-neutral-dark rounded-xl p-1 w-fit">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveView(tab.key);
              setSearch("");
              setSelectedCategory("all");
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
              activeView === tab.key
                ? "bg-primary/10 text-primary"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search + category filters                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-neutral-dark border border-border-dark rounded-xl px-4 py-2.5 flex-1">
          <span className="material-symbols-outlined text-slate-500 text-[20px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeView === "services"
                ? "Rechercher un service, vendeur, tag..."
                : activeView === "offres"
                ? "Rechercher une offre, client, competence..."
                : "Rechercher une agence, specialite..."
            }
            className="bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Category filter (services view only) */}
        {activeView === "services" && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0",
                  selectedCategory === cat.value
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-neutral-dark border border-border-dark text-slate-400 hover:border-primary/30 hover:text-slate-300"
                )}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Results count                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {activeView === "services" && (
            <>
              <span className="font-bold text-slate-300">{filteredServices.length}</span> service
              {filteredServices.length !== 1 ? "s" : ""} trouve
              {filteredServices.length !== 1 ? "s" : ""}
            </>
          )}
          {activeView === "offres" && (
            <>
              <span className="font-bold text-slate-300">{filteredOffers.length}</span> offre
              {filteredOffers.length !== 1 ? "s" : ""} client
              {filteredOffers.length !== 1 ? "s" : ""} disponible
              {filteredOffers.length !== 1 ? "s" : ""}
            </>
          )}
          {activeView === "agences" && (
            <>
              <span className="font-bold text-slate-300">{filteredAgencies.length}</span> agence
              {filteredAgencies.length !== 1 ? "s" : ""}
            </>
          )}
        </p>

        {(search || selectedCategory !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Effacer les filtres
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content views                                                       */}
      {/* ------------------------------------------------------------------ */}

      {/* Services view */}
      {activeView === "services" && (
        <>
          {filteredServices.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">
                search_off
              </span>
              <p className="text-slate-500 font-semibold">Aucun service trouve</p>
              <p className="text-xs text-slate-600 mt-1">
                Essayez de modifier vos criteres de recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onContact={(name) => setContactModal({ open: true, name })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Offers view */}
      {activeView === "offres" && (
        <>
          {filteredOffers.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">
                search_off
              </span>
              <p className="text-slate-500 font-semibold">Aucune offre trouvee</p>
              <p className="text-xs text-slate-600 mt-1">
                Essayez de modifier vos criteres de recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onApply={(o) => setApplyModal({ open: true, offer: o })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Agencies view */}
      {activeView === "agences" && (
        <>
          {filteredAgencies.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">
                search_off
              </span>
              <p className="text-slate-500 font-semibold">Aucune agence trouvee</p>
              <p className="text-xs text-slate-600 mt-1">
                Essayez de modifier vos criteres de recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  onContact={(name) => setContactModal({ open: true, name })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
