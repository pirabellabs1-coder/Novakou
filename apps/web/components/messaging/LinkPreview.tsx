"use client";

import type { LinkPreviewData } from "@/store/messaging";

interface LinkPreviewProps {
  preview: LinkPreviewData;
}

export function LinkPreview({ preview }: LinkPreviewProps) {
  const href = preview.url || `https://${preview.domain}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-border-dark rounded-lg overflow-hidden hover:border-primary/30 transition-colors bg-background-dark/50"
    >
      {preview.image && (
        <div className="w-full h-32 overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <img
            src={`https://www.google.com/s2/favicons?domain=${preview.domain}&sz=16`}
            alt=""
            className="w-4 h-4 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <p className="text-xs text-slate-500">{preview.domain}</p>
        </div>
        <p className="text-sm font-semibold text-white line-clamp-1">{preview.title}</p>
        {preview.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{preview.description}</p>
        )}
      </div>
    </a>
  );
}
