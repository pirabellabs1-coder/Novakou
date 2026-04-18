"use client";

/**
 * LessonVideoPlayer — lecteur vidéo custom Novakou sans branding tiers.
 *
 * Accepte 3 types d'URLs :
 *   - YouTube : watch, youtu.be, embed, shorts
 *   - Vimeo : player.vimeo.com ou vimeo.com/ID
 *   - Direct : .mp4 / .webm / .mov / Supabase / Cloudinary
 *
 * Techniques pour masquer le branding :
 *   - YouTube : youtube-nocookie.com + modestbranding=1 + rel=0 + showinfo=0
 *               + iv_load_policy=3 + disablekb=0 + color=white + playsinline=1
 *   - Vimeo   : title=0 + byline=0 + portrait=0 + dnt=1 + color=006e2f
 *   - Custom Novakou branding overlay (badge discret en haut à droite)
 *   - Coin bas-droit YouTube logo masqué par un rectangle CSS
 *
 * Le player native de chaque provider est conservé pour la fiabilité
 * mobile et l'accessibilité (contrairement aux players custom JS qui
 * cassent sur certains navigateurs).
 */

import { useMemo } from "react";

export interface LessonVideoPlayerProps {
  videoUrl: string;
  title?: string;
  /** Empêcher de partager / télécharger (Vimeo) + no-related YouTube */
  locked?: boolean;
  /** Couleur accent (progressbar Vimeo, default vert Novakou) */
  themeColor?: string;
  /** Ratio : "video" (16/9), "square" (1/1), "vertical" (9/16) */
  aspectRatio?: "video" | "square" | "vertical";
  className?: string;
}

function parseVideoSource(raw: string) {
  const url = raw.trim();
  if (!url) return { kind: "empty" as const };

  // Direct video (file)
  if (/\.(mp4|webm|mov|m4v|ogg|avi|mkv)(\?|$)/i.test(url)) {
    return { kind: "direct" as const, src: url };
  }
  if (url.includes("supabase.co") || url.includes("cloudinary.com")) {
    return { kind: "direct" as const, src: url };
  }

  // YouTube
  const yt =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
  if (yt) {
    return { kind: "youtube" as const, id: yt[1] };
  }

  // Vimeo
  const vim =
    url.match(/(?:vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  if (vim) {
    return { kind: "vimeo" as const, id: vim[1] };
  }

  // Already an embed URL passed in raw — trust it
  if (url.includes("embed") || url.includes("player.vimeo.com")) {
    return { kind: "unknown" as const, src: url };
  }

  return { kind: "unknown" as const, src: url };
}

function youtubeEmbedUrl(id: string, opts: { locked: boolean }): string {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
    iv_load_policy: "3",
    fs: "1",
    playsinline: "1",
    color: "white",
    cc_load_policy: "0",
  });
  if (typeof window !== "undefined") {
    params.set("origin", window.location.origin);
  }
  if (opts.locked) {
    params.set("disablekb", "1");
  }
  // youtube-nocookie = privacy-enhanced + supports modestbranding strict
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

function vimeoEmbedUrl(id: string, opts: { locked: boolean; themeColor: string }): string {
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
    color: opts.themeColor.replace("#", ""),
    autopause: "1",
  });
  if (opts.locked) {
    params.set("pip", "0");
  }
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

export default function LessonVideoPlayer({
  videoUrl,
  title = "",
  locked = false,
  themeColor = "#006e2f",
  aspectRatio = "video",
  className = "",
}: LessonVideoPlayerProps) {
  const source = useMemo(() => parseVideoSource(videoUrl), [videoUrl]);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "vertical"
        ? "aspect-[9/16]"
        : "aspect-video";

  // ── Empty state ─────────────────────────────────────────────────────
  if (source.kind === "empty") {
    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-white/70">
          <span className="material-symbols-outlined text-6xl mb-2">smart_display</span>
          <p className="text-sm font-semibold">Aucune vidéo ajoutée</p>
        </div>
      </div>
    );
  }

  // ── Direct video file (Supabase, Cloudinary, MP4…) ──────────────────
  if (source.kind === "direct") {
    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-black ${className}`}>
        <video
          src={source.src}
          controls
          controlsList={locked ? "nodownload noplaybackrate" : "nodownload"}
          disablePictureInPicture={locked}
          onContextMenu={locked ? (e) => e.preventDefault() : undefined}
          preload="metadata"
          playsInline
          className="w-full h-full object-contain"
          title={title}
        >
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
        <NovakouBadge />
      </div>
    );
  }

  // ── YouTube embed ───────────────────────────────────────────────────
  if (source.kind === "youtube") {
    const src = youtubeEmbedUrl(source.id, { locked });
    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-black group ${className}`}>
        <iframe
          src={src}
          title={title || "Vidéo de la leçon"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full border-0"
        />
        {/* Masque le logo YouTube en bas-droite (présent même avec modestbranding) */}
        <div
          aria-hidden
          className="absolute bottom-[12%] right-0 w-[100px] h-[40px] bg-black pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
        <NovakouBadge />
      </div>
    );
  }

  // ── Vimeo embed ─────────────────────────────────────────────────────
  if (source.kind === "vimeo") {
    const src = vimeoEmbedUrl(source.id, { locked, themeColor });
    return (
      <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-black ${className}`}>
        <iframe
          src={src}
          title={title || "Vidéo de la leçon"}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full border-0"
        />
        <NovakouBadge />
      </div>
    );
  }

  // ── Unknown / generic iframe fallback ───────────────────────────────
  return (
    <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-black ${className}`}>
      <iframe
        src={source.src}
        title={title || "Vidéo"}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
      />
      <NovakouBadge />
    </div>
  );
}

/** Petit badge Novakou subtil en haut à droite — renforce le branding propre. */
function NovakouBadge() {
  return (
    <div
      aria-hidden
      className="absolute top-3 right-3 pointer-events-none inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-white text-[8px] font-extrabold"
        style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
      >
        N
      </span>
      <span className="text-[10px] font-bold text-white/90 tracking-wider">Novakou</span>
    </div>
  );
}

/** Utilitaire : valide rapidement si une URL est reconnue comme vidéo supportée. */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  const p = parseVideoSource(url);
  return p.kind === "youtube" || p.kind === "vimeo" || p.kind === "direct";
}

/** Utilitaire : label court pour l'UI ("YouTube", "Vimeo", "Fichier"). */
export function getVideoProviderLabel(url: string): string {
  const p = parseVideoSource(url);
  if (p.kind === "youtube") return "YouTube";
  if (p.kind === "vimeo") return "Vimeo";
  if (p.kind === "direct") return "Fichier vidéo";
  return "Lien vidéo";
}
