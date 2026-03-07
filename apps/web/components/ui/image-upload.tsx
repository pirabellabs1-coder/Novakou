"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (url: string) => void;
  aspectRatio?: string;
  className?: string;
  placeholder?: string;
  rounded?: boolean;
}

export function ImageUpload({
  currentImage,
  onUpload,
  aspectRatio = "aspect-square",
  className,
  placeholder = "Cliquez pour ajouter une photo",
  rounded = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError("");
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(40);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      const data = await res.json();
      setProgress(100);
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input value
    if (inputRef.current) inputRef.current.value = "";
  }, [handleUpload]);

  return (
    <div className={cn("relative group", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "w-full overflow-hidden border-2 border-dashed border-white/10 hover:border-primary/40 transition-all cursor-pointer",
          rounded ? "rounded-full" : "rounded-xl",
          aspectRatio,
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {currentImage ? (
          <div className="relative w-full h-full">
            <img
              src={currentImage}
              alt=""
              className={cn("w-full h-full object-cover", rounded ? "rounded-full" : "rounded-xl")}
            />
            {/* Overlay on hover */}
            <div className={cn(
              "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
              rounded ? "rounded-full" : "rounded-xl"
            )}>
              <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            <span className="material-symbols-outlined text-3xl text-slate-500">add_photo_alternate</span>
            <span className="text-xs text-slate-500 text-center">{placeholder}</span>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-white/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-white">{progress}%</p>
            </div>
          </div>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
