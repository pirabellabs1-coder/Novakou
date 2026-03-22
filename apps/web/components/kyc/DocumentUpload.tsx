"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: boolean;
  accept?: string;
  maxSizeMB?: number;
  hint?: string;
  /** Force camera capture (e.g. "user" for front camera selfie) */
  capture?: "user" | "environment";
}

export function DocumentUpload({
  label,
  value,
  onChange,
  required = false,
  error = false,
  accept = "image/jpeg,image/png,application/pdf",
  maxSizeMB = 10,
  hint,
  capture,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes("image");
  };

  const handleUpload = useCallback(
    async (file: File) => {
      setUploadError("");

      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setUploadError(`Le fichier depasse ${maxSizeMB} Mo`);
        return;
      }

      // Validate type
      const allowedTypes = accept.split(",").map((t) => t.trim());
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const isAllowed =
        allowedTypes.some((t) => file.type === t) ||
        allowedTypes.some(
          (t) =>
            (t === "image/jpeg" && (fileExtension === "jpg" || fileExtension === "jpeg")) ||
            (t === "image/png" && fileExtension === "png") ||
            (t === "application/pdf" && fileExtension === "pdf")
        );

      if (!isAllowed) {
        setUploadError("Type de fichier non autorise (JPG, PNG ou PDF)");
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      setFileName(file.name);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 150);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "kyc-documents");

        const res = await fetch("/api/upload/file", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const data = await res.json();
          setUploadError(data.error || "Erreur lors de l'upload");
          setUploadProgress(0);
          setUploading(false);
          return;
        }

        const data = await res.json();
        setUploadProgress(100);
        onChange(data.file?.url || data.file?.path || `/uploads/kyc/${file.name}`);

        setTimeout(() => {
          setUploading(false);
        }, 500);
      } catch {
        clearInterval(progressInterval);
        setUploadError("Erreur de connexion");
        setUploadProgress(0);
        setUploading(false);
      }
    },
    [accept, maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onChange("");
    setFileName("");
    setUploadError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {value ? (
        // File uploaded preview
        <div
          className={cn(
            "border rounded-xl p-4 transition-colors",
            error
              ? "border-red-500 bg-red-500/5"
              : "border-emerald-500/30 bg-emerald-500/5"
          )}
        >
          <div className="flex items-center gap-3">
            {isImage(value) ? (
              <div className="w-16 h-16 rounded-lg bg-background-dark border border-border-dark overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Document"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-emerald-400">
                    image
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-background-dark border border-border-dark flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-primary">
                  description
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-400 truncate">
                {fileName || "Document telecharge"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Upload reussi</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
              title="Supprimer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      ) : (
        // Upload dropzone
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            uploading && "pointer-events-none opacity-80",
            dragOver
              ? "border-primary bg-primary/5"
              : error
                ? "border-red-500 bg-red-500/5 hover:border-red-400"
                : "border-border-dark hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            capture={capture}
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3">
              <span className="material-symbols-outlined text-3xl text-primary animate-pulse block mx-auto">
                cloud_upload
              </span>
              <p className="text-sm text-slate-300">{fileName}</p>
              <div className="w-full max-w-xs mx-auto h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <span
                className={cn(
                  "material-symbols-outlined text-3xl block mx-auto mb-2",
                  error ? "text-red-400" : "text-slate-500"
                )}
              >
                cloud_upload
              </span>
              <p className={cn("text-sm", error ? "text-red-400" : "text-slate-400")}>
                Glissez un fichier ici ou cliquez pour selectionner
              </p>
              <p className="text-xs text-slate-500 mt-1">
                JPG, PNG ou PDF — {maxSizeMB} Mo max
              </p>
            </>
          )}
        </div>
      )}

      {hint && !uploadError && !value && (
        <p className="text-xs text-slate-500 mt-1.5">{hint}</p>
      )}

      {uploadError && (
        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {uploadError}
        </p>
      )}
    </div>
  );
}
