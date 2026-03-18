"use client";

import { useEffect } from "react";

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <img
          src={imageUrl}
          alt="Image en taille reelle"
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        <div className="flex items-center justify-center gap-4 mt-4">
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Telecharger
          </a>
        </div>
      </div>
    </div>
  );
}
