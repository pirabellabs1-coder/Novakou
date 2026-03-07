"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Map 2-letter country codes to flag emojis */
const countryFlags: Record<string, string> = {
  SN: "\u{1F1F8}\u{1F1F3}",
  CI: "\u{1F1E8}\u{1F1EE}",
  CM: "\u{1F1E8}\u{1F1F2}",
  FR: "\u{1F1EB}\u{1F1F7}",
  MA: "\u{1F1F2}\u{1F1E6}",
  GH: "\u{1F1EC}\u{1F1ED}",
  BE: "\u{1F1E7}\u{1F1EA}",
  NG: "\u{1F1F3}\u{1F1EC}",
  US: "\u{1F1FA}\u{1F1F8}",
  GB: "\u{1F1EC}\u{1F1E7}",
  CA: "\u{1F1E8}\u{1F1E6}",
  DE: "\u{1F1E9}\u{1F1EA}",
  TN: "\u{1F1F9}\u{1F1F3}",
  DZ: "\u{1F1E9}\u{1F1FF}",
  CD: "\u{1F1E8}\u{1F1E9}",
  ML: "\u{1F1F2}\u{1F1F1}",
  BF: "\u{1F1E7}\u{1F1EB}",
  NE: "\u{1F1F3}\u{1F1EA}",
  TD: "\u{1F1F9}\u{1F1E9}",
  GA: "\u{1F1EC}\u{1F1E6}",
  BJ: "\u{1F1E7}\u{1F1EF}",
  TG: "\u{1F1F9}\u{1F1EC}",
  KE: "\u{1F1F0}\u{1F1EA}",
  RW: "\u{1F1F7}\u{1F1FC}",
};

function getFlagEmoji(code: string): string {
  return countryFlags[code.toUpperCase()] || "\u{1F30D}";
}

export interface ReviewData {
  id: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  serviceTitle: string;
  qualite: number;
  communication: number;
  delai: number;
  rating: number;
  comment: string;
  reply: string | null;
  repliedAt: string | null;
  helpful: number;
  createdAt: string;
}

function CriteriaBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min((value / 5) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-500 w-[90px] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-slate-300 w-6 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={cn(
            "material-symbols-outlined",
            size,
            s <= Math.round(rating) ? "text-yellow-400" : "text-white/10"
          )}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function AvatarDisplay({
  clientAvatar,
  clientName,
}: {
  clientAvatar: string;
  clientName: string;
}) {
  const [imgError, setImgError] = useState(false);

  // If avatar string is short (< 5 chars), treat as initials
  const useInitials = clientAvatar.length < 5 || imgError;

  if (useInitials) {
    const initials = clientName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
        <span className="text-xs font-bold text-primary">{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
      <Image
        src={clientAvatar}
        alt={clientName}
        width={40}
        height={40}
        className="rounded-full object-cover"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
}

export default function ReviewCard({ review }: { review: ReviewData }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [voted, setVoted] = useState(false);

  const formattedDate = new Date(review.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleHelpful = () => {
    if (voted) return;
    setVoted(true);
    setHelpfulCount((c) => c + 1);
  };

  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/10">
      {/* Header: avatar, name, country, date, stars */}
      <div className="flex items-start gap-3">
        <AvatarDisplay
          clientAvatar={review.clientAvatar}
          clientName={review.clientName}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {review.clientName}
              </span>
              <span className="text-base" title={review.clientCountry}>
                {getFlagEmoji(review.clientCountry)}
              </span>
            </div>
            <span className="text-xs text-slate-600">{formattedDate}</span>
          </div>

          {/* Overall stars */}
          <div className="flex items-center gap-2 mt-1">
            <Stars rating={review.rating} size="text-sm" />
            <span className="text-xs font-bold text-yellow-400">
              {review.rating.toFixed(1)}
            </span>
          </div>

          {/* 3 criteria bars */}
          <div className="mt-3 space-y-1.5">
            <CriteriaBar label="Qualit\u00e9" value={review.qualite} />
            <CriteriaBar label="Communication" value={review.communication} />
            <CriteriaBar label="D\u00e9lai" value={review.delai} />
          </div>

          {/* Comment */}
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {review.comment}
          </p>

          {/* Vendor reply */}
          {review.reply && (
            <div className="mt-3 ml-2 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg py-2 pr-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-primary text-sm">
                  reply
                </span>
                <span className="text-xs text-primary font-semibold">
                  R\u00e9ponse du vendeur
                </span>
                {review.repliedAt && (
                  <span className="text-[10px] text-slate-600 ml-auto">
                    {new Date(review.repliedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {review.reply}
              </p>
            </div>
          )}

          {/* Utile button */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleHelpful}
              disabled={voted}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                voted
                  ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="material-symbols-outlined text-sm" style={voted ? { fontVariationSettings: "'FILL' 1" } : {}}>
                thumb_up
              </span>
              Utile
              {helpfulCount > 0 && (
                <span className="text-[10px] font-bold">({helpfulCount})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
