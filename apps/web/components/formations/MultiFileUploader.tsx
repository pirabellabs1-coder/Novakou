"use client";

import { useCallback, useRef, useState } from "react";

export type ProductFile = {
  /** Persisted DB row id, undefined for files not yet saved. */
  id?: string;
  name: string;
  url: string;
  size?: number | null;
  mimeType?: string | null;
};

type Props = {
  value: ProductFile[];
  onChange: (files: ProductFile[]) => void;
  productType?: "EBOOK" | "PDF" | "TEMPLATE" | "AUDIO" | "VIDEO" | "LICENCE" | "AUTRE";
  /** Max number of files allowed. Default 20. */
  maxFiles?: number;
  /** Allowed mime / extension hint passed as `accept` to the file input. */
  accept?: string;
};

const DEFAULT_ACCEPT_BY_TYPE: Record<string, string> = {
  EBOOK:    ".pdf,.epub",
  PDF:      ".pdf",
  TEMPLATE: ".zip,.rar,.7z,.psd,.ai",
  AUDIO:    ".mp3,.wav,.m4a,.ogg",
  VIDEO:    ".mp4,.webm,.mov",
  LICENCE:  ".txt,.pdf,.zip",
  AUTRE:    ".pdf,.zip,.doc,.docx,.xls,.xlsx",
};

const HINT_BY_TYPE: Record<string, string> = {
  EBOOK:    "PDF ou EPUB · Max 25 MB par fichier",
  PDF:      "PDF · Max 25 MB par fichier",
  TEMPLATE: "ZIP / PSD / AI · Max 25 MB par fichier",
  AUDIO:    "MP3 / WAV / M4A · Max 25 MB par fichier",
  VIDEO:    "MP4 / WebM / MOV · Max 25 MB par fichier",
  LICENCE:  "Fichier de licence · Max 25 MB",
  AUTRE:    "PDF / ZIP / Office · Max 25 MB par fichier",
};

const ICON_BY_MIME = (name: string, mime?: string | null) => {
  const lower = name.toLowerCase();
  if (mime?.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/.test(lower)) return "audio_file";
  if (mime?.startsWith("video/") || /\.(mp4|webm|mov)$/.test(lower)) return "video_file";
  if (mime === "application/pdf" || lower.endsWith(".pdf")) return "picture_as_pdf";
  if (mime === "application/zip" || /\.(zip|rar|7z)$/.test(lower)) return "folder_zip";
  if (/\.(epub)$/.test(lower)) return "menu_book";
  if (/\.(psd|ai)$/.test(lower)) return "image";
  return "draft";
};

function formatSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MultiFileUploader({
  value,
  onChange,
  productType = "PDF",
  maxFiles = 20,
  accept,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptAttr = accept ?? DEFAULT_ACCEPT_BY_TYPE[productType] ?? DEFAULT_ACCEPT_BY_TYPE.AUTRE;
  const hint = HINT_BY_TYPE[productType] ?? HINT_BY_TYPE.AUTRE;

  const uploadOne = useCallback(async (file: File): Promise<ProductFile | null> => {
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "order-deliveries");

    // Retry sur 502/503/504 (cold start Vercel) — 3 tentatives max
    const attempt = async (n: number): Promise<Response> => {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 90_000);
      try {
        const r = await fetch("/api/upload/file", { method: "POST", body: form, signal: ctrl.signal });
        clearTimeout(tid);
        if ((r.status === 502 || r.status === 503 || r.status === 504) && n < 2) {
          await new Promise((res) => setTimeout(res, 1500 * (n + 1)));
          return attempt(n + 1);
        }
        return r;
      } catch (err) {
        clearTimeout(tid);
        if (n < 2) {
          await new Promise((res) => setTimeout(res, 1500 * (n + 1)));
          return attempt(n + 1);
        }
        throw err;
      }
    };

    const res = await attempt(0);

    if (res.status === 401) {
      setError("Session expirée. Reconnectez-vous puis réessayez.");
      return null;
    }

    let data: { success?: boolean; file?: { url?: string }; error?: string } | null = null;
    try { data = await res.json(); } catch {
      setError(`Réponse invalide du serveur (${res.status}). Réessayez dans quelques instants.`);
      return null;
    }

    if (data?.success && data.file?.url) {
      return {
        name: file.name,
        url: data.file.url,
        size: file.size,
        mimeType: file.type || null,
      };
    }
    setError(data?.error ?? `Upload échoué (${res.status})`);
    return null;
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(fileList);
      if (value.length + incoming.length > maxFiles) {
        setError(`Maximum ${maxFiles} fichiers autorisés.`);
        return;
      }
      setUploading(true);
      try {
        const uploaded: ProductFile[] = [];
        for (const f of incoming) {
          const result = await uploadOne(f);
          if (result) uploaded.push(result);
        }
        if (uploaded.length > 0) onChange([...value, ...uploaded]);
      } catch (err) {
        console.error(err);
        setError("Erreur réseau pendant l'upload");
      } finally {
        setUploading(false);
      }
    },
    [value, maxFiles, onChange, uploadOne],
  );

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const removeAt = (idx: number) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const moveAt = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const addUrlPaste = () => {
    const url = window.prompt("Coller l'URL du fichier (https://…)") ?? "";
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("URL invalide (doit commencer par http:// ou https://)");
      return;
    }
    if (value.length >= maxFiles) {
      setError(`Maximum ${maxFiles} fichiers atteint.`);
      return;
    }
    const name = decodeURIComponent(trimmed.split("?")[0].split("/").pop() ?? "fichier");
    onChange([...value, { name, url: trimmed }]);
  };

  return (
    <div className="space-y-3">
      {/* Files list */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f, idx) => (
            <li
              key={(f.id ?? f.url) + idx}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-md"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006e2f] flex-shrink-0">
                {ICON_BY_MIME(f.name, f.mimeType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{f.name}</p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  {formatSize(f.size) && <span>{formatSize(f.size)}</span>}
                  {f.mimeType && <span className="font-mono">{f.mimeType}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveAt(idx, -1)}
                  disabled={idx === 0}
                  title="Monter"
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveAt(idx, 1)}
                  disabled={idx === value.length - 1}
                  title="Descendre"
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </button>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ouvrir"
                  className="p-1.5 text-zinc-400 hover:text-[#006e2f] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  title="Retirer"
                  className="p-1.5 text-zinc-400 hover:text-[#ba1a1a] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed p-6 transition-all cursor-pointer ${
          dragging
            ? "border-[#22c55e] bg-[#22c55e]/5"
            : "border-[#bccbb9] bg-[#f3f3f4] hover:bg-[#e8e8e8]"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <span className="material-symbols-outlined text-4xl text-[#006e2f] animate-spin mb-3">progress_activity</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Upload en cours…</p>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-zinc-400 mb-2">upload_file</span>
              <p className="text-sm font-bold text-zinc-900">
                {dragging
                  ? "Déposez vos fichiers ici"
                  : value.length === 0
                    ? "Glissez vos fichiers"
                    : "Ajouter d'autres fichiers"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">
                ou cliquez pour parcourir · plusieurs fichiers acceptés
              </p>
              <p className="text-[10px] text-zinc-400 mt-2">{hint}</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple
          onChange={onPicked}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
        <span>
          {value.length} / {maxFiles} fichier{value.length > 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={addUrlPaste}
          className="font-bold text-[#006e2f] hover:underline"
        >
          + Coller une URL
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-[#ba1a1a] font-bold uppercase tracking-widest">{error}</p>
      )}
    </div>
  );
}
