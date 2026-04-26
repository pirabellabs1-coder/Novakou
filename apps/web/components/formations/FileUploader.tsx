"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type UploadedFile = {
  name: string;
  size: number;
  url: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  productType?: "EBOOK" | "PDF" | "TEMPLATE" | "AUDIO" | "VIDEO" | "LICENCE" | "AUTRE";
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; accept: string; hint: string }> = {
  EBOOK:    { icon: "menu_book",       label: "E-book",   accept: ".pdf,.epub",                       hint: "PDF ou EPUB · Max 25 MB" },
  PDF:      { icon: "picture_as_pdf",  label: "PDF",      accept: ".pdf",                             hint: "PDF uniquement · Max 25 MB" },
  TEMPLATE: { icon: "folder_zip",      label: "Template", accept: ".zip,.rar,.7z,.psd,.ai",           hint: "ZIP / PSD / AI · Max 25 MB" },
  AUDIO:    { icon: "audio_file",      label: "Audio",    accept: ".mp3,.wav,.m4a,.ogg",              hint: "MP3 / WAV / M4A · Max 25 MB" },
  VIDEO:    { icon: "video_file",      label: "Vidéo",    accept: ".mp4,.webm,.mov",                  hint: "MP4 / WebM / MOV · Max 25 MB" },
  LICENCE:  { icon: "key",             label: "Licence",  accept: ".txt,.pdf,.zip",                   hint: "Fichier de licence · Max 25 MB" },
  AUTRE:    { icon: "draft",           label: "Fichier",  accept: ".pdf,.zip,.doc,.docx,.xls,.xlsx",  hint: "PDF / ZIP / Office · Max 25 MB" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({ value, onChange, productType = "PDF", accept }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);

  const config = TYPE_CONFIG[productType] ?? TYPE_CONFIG.AUTRE;
  const acceptAttr = accept ?? config.accept;

  // Sync uploaded preview when `value` prop arrives from parent (e.g. data loaded
  // after mount in an edit page). Without this the UI shows the empty drop zone
  // even when a file is already attached in DB.
  useEffect(() => {
    if (value && (!uploaded || uploaded.url !== value)) {
      const fileName =
        decodeURIComponent(value.split("?")[0].split("/").pop() ?? "fichier") ||
        "fichier";
      setUploaded({ name: fileName, size: 0, url: value });
    } else if (!value && uploaded) {
      setUploaded(null);
    }
  }, [value, uploaded]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "order-deliveries");
      const res = await fetch("/api/upload/file", { method: "POST", body: form });
      const data = await res.json();
      if (data.success && data.file?.url) {
        onChange(data.file.url);
        setUploaded({ name: file.name, size: file.size, url: data.file.url });
      } else {
        setError(data.error ?? "Upload échoué");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

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
        onClick={() => !uploaded && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed p-10 transition-all cursor-pointer ${
          dragging
            ? "border-[#22c55e] bg-[#22c55e]/5"
            : uploaded
            ? "border-[#22c55e] bg-[#22c55e]/5 cursor-default"
            : "border-[#bccbb9] bg-[#f3f3f4] hover:bg-[#e8e8e8]"
        }`}
      >
        {uploaded ? (
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-[#22c55e] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[28px] text-[#004b1e]">check</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">Fichier uploadé</p>
              <p className="text-sm font-bold text-zinc-900 truncate">{uploaded.name}</p>
              {uploaded.size > 0 && (
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                  {formatSize(uploaded.size)}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a
                href={uploaded.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 bg-white text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors"
              >
                Aperçu
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploaded(null);
                  onChange("");
                }}
                className="px-4 py-2 bg-zinc-200 text-zinc-900 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors"
              >
                Remplacer
              </button>
            </div>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-[#006e2f] animate-spin mb-4">progress_activity</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Upload en cours…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-400 mb-4">{config.icon}</span>
            <p className="text-sm font-bold text-zinc-900">
              {dragging ? "Déposez votre fichier ici" : "Glissez votre fichier"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">
              ou cliquez pour parcourir
            </p>
            <p className="text-[10px] text-zinc-400 mt-3">{config.hint}</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={acceptAttr} onChange={onFilePicked} className="hidden" />
      </div>

      {error && (
        <p className="text-[10px] text-[#ba1a1a] font-bold uppercase tracking-widest">{error}</p>
      )}

      {/* Manual URL input as fallback */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Ou collez une URL directe
        </p>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setUploaded(null);
          }}
          placeholder="https://…"
          className="w-full bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-3 px-4 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
      </div>
    </div>
  );
}
