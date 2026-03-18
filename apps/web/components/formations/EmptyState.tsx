"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && onCtaClick && !ctaHref && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
