"use client";

import { useRef, useState, useCallback } from "react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: "service" | "portfolio" | "avatar";
  aspectClass?: string; // Tailwind aspect classes, default "aspect-square"
  accept?: string;
  helper?: string;
};

export function ImageUploader({
  value,
  onChange,
  folder = "portfolio",
  aspectClass = "aspect-square",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  helper = "Recommandé : 1280×720px · JPG ou PNG · Max 5 MB",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    // Validation client preventive (avant upload reseau)
    const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setError("Format non supporte (JPG, PNG, GIF, WebP)");
      setUploading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(`Trop volumineux (max 5 MB, votre fichier ${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      setUploading(false);
      return;
    }

    const tryUpload = async (attempt: number): Promise<void> => {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);

      // Timeout 60s (cold start Vercel + upload Cloudinary)
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 60_000);

      let res: Response;
      try {
        res = await fetch("/api/upload/image", { method: "POST", body: form, signal: ctrl.signal });
      } catch (err) {
        clearTimeout(tid);
        // AbortError = timeout, TypeError = vraie erreur reseau (connexion coupee, DNS, etc.)
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          return tryUpload(attempt + 1);
        }
        throw new Error(isAbort ? "Le serveur met trop de temps a repondre. Reessayez." : "Connexion impossible. Verifiez votre internet.");
      }
      clearTimeout(tid);

      // 502/503/504 = Bad Gateway / cold start / overload — retry avec backoff
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        return tryUpload(attempt + 1);
      }

      // 401 = session expiree — message clair
      if (res.status === 401) {
        throw new Error("Session expiree. Reconnectez-vous puis reessayez.");
      }

      // Parse JSON safely (le serveur peut renvoyer du HTML en cas de 502)
      let data: { url?: string; error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Reponse invalide (${res.status}). Reessayez dans quelques instants.`);
      }

      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? `Upload echoue (${res.status})`);
      }

      onChange(data.url);
    };

    try {
      await tryUpload(0);
    } catch (err) {
      console.error("[ImageUploader]", err);
      setError(err instanceof Error ? err.message : "Erreur reseau");
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`${aspectClass} relative overflow-hidden border-2 border-dashed cursor-pointer transition-all group ${
          dragging
            ? "border-[#22c55e] bg-[#22c55e]/5"
            : value
            ? "border-transparent bg-zinc-100"
            : "border-[#bccbb9] bg-[#f3f3f4] hover:bg-[#e8e8e8]"
        }`}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold uppercase tracking-widest">
                Remplacer l&apos;image
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 w-7 h-7 bg-zinc-900/80 hover:bg-[#ba1a1a] text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <span className="material-symbols-outlined text-5xl text-[#006e2f] animate-spin mb-4">progress_activity</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Upload en cours…</p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-5xl text-zinc-300 group-hover:text-[#006e2f] transition-colors">
                  add_photo_alternate
                </span>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {dragging ? "Déposez ici" : "Glissez ou cliquez"}
                </p>
              </>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={onFilePicked} className="hidden" />
      </div>

      <p className="text-[10px] text-zinc-400 leading-tight">{helper}</p>

      {error && (
        <p className="text-[10px] text-[#ba1a1a] font-bold uppercase tracking-widest">{error}</p>
      )}

      {value && (
        <p className="text-[10px] font-mono text-zinc-400 break-all">{value.length > 80 ? `${value.slice(0, 80)}…` : value}</p>
      )}
    </div>
  );
}
