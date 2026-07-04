"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  accept?: "image" | "video" | "both" | "audio";
  label?: string;
  maxSizeMB?: number;
  aspectRatio?: "video" | "square" | "landscape" | "auto";
}

const ACCEPT_MAP: Record<string, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
  video: "video/mp4,video/webm,video/quicktime",
  both: "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime",
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4",
};

export function MediaUpload({
  value,
  onChange,
  accept = "image",
  label,
  aspectRatio = "landscape",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = value && /\.(mp4|webm|mov|quicktime)/i.test(value) && accept !== "audio";
  const isAudio = value && (accept === "audio" || /\.(mp3|wav|ogg|aac|m4a)(\?|$)/i.test(value));

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/funnel-media", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          setError(json.error || "Upload échoué");
          return;
        }
        onChange(json.data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur réseau");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // reset so same file can be re-selected
  }

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "landscape"
      ? "aspect-[16/10]"
      : "";

  // ── Has value: show preview with replace/remove buttons ──
  if (value) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 ${isAudio ? "" : aspectClass}`}>
          {isAudio ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio src={value ?? undefined} controls className="w-full px-2 py-3" />
          ) : isVideo ? (
            <video src={value} controls className="w-full h-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 backdrop-blur-sm hover:bg-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1"
              title="Remplacer"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              Remplacer
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="bg-white/90 backdrop-blur-sm hover:bg-red-50 text-red-600 text-xs font-semibold px-2 py-1.5 rounded-lg shadow-sm"
              title="Supprimer"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[accept]}
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading && (
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            Upload en cours…
          </p>
        )}
      </div>
    );
  }

  // ── No value: show drag-drop zone ──
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={uploading}
        className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${aspectClass} flex flex-col items-center justify-center ${
          dragActive
            ? "border-[#006e2f] bg-[#006e2f]/5"
            : "border-gray-300 bg-gray-50 hover:border-[#006e2f]/40 hover:bg-gray-100"
        } ${uploading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      >
        {uploading ? (
          <>
            <span className="material-symbols-outlined text-[#006e2f] text-[32px] animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-gray-700 mt-2">Upload en cours…</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#006e2f]/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px] text-[#006e2f]">
                {accept === "video" ? "movie" : accept === "both" ? "perm_media" : "image"}
              </span>
            </div>
            <p className="text-sm font-bold text-[#191c1e]">
              Glissez votre fichier ici ou cliquez
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept === "image" && "PNG, JPG, WebP, GIF, SVG"}
              {accept === "video" && "MP4, WebM, MOV"}
              {accept === "both" && "Images et vidéos"}
              {" · max 50 MB"}
            </p>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
          <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
