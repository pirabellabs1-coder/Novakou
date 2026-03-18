"use client";

import type { LinkPreviewData } from "@/store/messaging";

interface LinkPreviewProps {
  preview: LinkPreviewData;
}

export function LinkPreview({ preview }: LinkPreviewProps) {
  const url = `https://${preview.domain}`;

  return (
    <a
      href={url}
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
          />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-slate-500 mb-1">{preview.domain}</p>
        <p className="text-sm font-semibold text-white line-clamp-1">{preview.title}</p>
        {preview.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{preview.description}</p>
        )}
      </div>
    </a>
  );
}
