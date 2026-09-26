"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { productImageSrc } from "@/lib/utils/image-url";

/**
 * Visuel principal d'une fiche en double-bezel, au ratio stable (aucun saut
 * de mise en page), zoom léger au survol. Pas de révélation différée : c'est
 * l'élément LCP, il doit être peint tout de suite.
 *
 * `ajuster: "contain"` (produit numérique) montre l'image EN ENTIER, jamais
 * rognée, sur un fond flouté de la même image pour combler les bords.
 */
export function VignetteFiche({
  src,
  alt,
  ratio = "16/9",
  ajuster = "cover",
  Icone,
  badges,
  media,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  ratio?: "16/9" | "4/3";
  ajuster?: "cover" | "contain";
  /** Motif de repli quand il n'y a pas d'image. */
  Icone: LucideIcon;
  /** Étiquettes posées en haut à gauche (type, catégorie, remise). */
  badges?: ReactNode;
  /** Remplace l'image (ex. vidéo de présentation d'une formation). */
  media?: ReactNode;
  className?: string;
}) {
  const url = src ? (productImageSrc(src, 1200) ?? src) : null;
  return (
    <figure className={`nkf-bezel m-0 ${className}`}>
      <div className={`nkf-bezel__core nkf-media ${ratio === "4/3" ? "aspect-[4/3]" : "aspect-video"}`}>
        {media ??
          (url ? (
            <>
              {ajuster === "contain" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" aria-hidden="true" className="nkf-media__blur" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alt}
                decoding="async"
                fetchPriority="high"
                className={`nkf-media__img absolute inset-0 h-full w-full ${ajuster === "contain" ? "object-contain" : "object-cover"}`}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 grid place-items-center bg-[radial-gradient(60%_60%_at_50%_40%,#DFEDE4,#F0F6F2)] text-[#006E2F]/60"
              aria-hidden="true"
            >
              <Icone size={72} strokeWidth={1.1} />
            </div>
          ))}
        {badges && <div className="absolute left-4 top-4 z-[1] flex flex-wrap gap-2">{badges}</div>}
      </div>
    </figure>
  );
}
