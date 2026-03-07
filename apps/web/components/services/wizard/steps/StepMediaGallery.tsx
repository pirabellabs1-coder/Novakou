"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { useServiceWizardStore, type UploadedImage } from "@/store/service-wizard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ADDITIONAL_IMAGES = 5;

function SortableThumbnail({
  image,
  onRemove,
}: {
  image: UploadedImage;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-28 h-20 rounded-xl overflow-hidden border border-white/10 group flex-shrink-0"
    >
      <img src={image.url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-0.5 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <span className="material-symbols-outlined text-sm">drag_indicator</span>
      </button>
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-0.5 bg-red-500/80 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

function extractVideoId(url: string): { provider: "youtube" | "vimeo"; id: string } | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { provider: "youtube", id: ytMatch[1] };

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return { provider: "vimeo", id: vimeoMatch[1] };

  return null;
}

export function StepMediaGallery({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function uploadFile(file: File): Promise<UploadedImage | null> {
    if (!ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES]) {
      setUploadError("Format non supporté. Utilisez JPEG, PNG, GIF ou WebP.");
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("L'image dépasse la taille maximale de 5 MB.");
      return null;
    }

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/service-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error || "Erreur lors de l'upload");
        return null;
      }

      const data = await res.json();
      return {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: data.url,
        width: data.width,
        height: data.height,
      };
    } catch {
      setUploadError("Erreur réseau lors de l'upload");
      return null;
    } finally {
      setUploading(false);
    }
  }

  // Main image dropzone
  const onDropMain = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const image = await uploadFile(acceptedFiles[0]);
      if (image) store.setMainImage(image);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const mainDropzone = useDropzone({
    onDrop: onDropMain,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  // Additional images dropzone
  const onDropAdditional = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = MAX_ADDITIONAL_IMAGES - store.additionalImages.length;
      const filesToUpload = acceptedFiles.slice(0, remaining);

      for (const file of filesToUpload) {
        const image = await uploadFile(file);
        if (image) store.addAdditionalImage(image);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.additionalImages.length]
  );

  const additionalDropzone = useDropzone({
    onDrop: onDropAdditional,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_ADDITIONAL_IMAGES - store.additionalImages.length,
    disabled: store.additionalImages.length >= MAX_ADDITIONAL_IMAGES,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = store.additionalImages.findIndex((i) => i.id === active.id);
      const newIndex = store.additionalImages.findIndex((i) => i.id === over.id);
      store.reorderAdditionalImages(
        arrayMove(store.additionalImages, oldIndex, newIndex)
      );
    }
  }

  const videoInfo = store.videoUrl ? extractVideoId(store.videoUrl) : null;

  function handleNext() {
    if (!store.mainImage) {
      setUploadError("L'image principale est obligatoire");
      return;
    }
    setUploadError("");
    store.markStepCompleted(7);
    store.setStep(8);
  }

  return (
    <div className="space-y-8">
      {/* Main image */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Image principale <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Dimensions recommandées : 1260 × 708px (16:9). Formats : JPEG, PNG, GIF, WebP. Max 5 MB.
        </p>

        {store.mainImage ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10 max-w-lg">
            <img
              src={store.mainImage.url}
              alt="Image principale"
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => mainDropzone.open()}
                  className="px-3 py-1.5 bg-white/90 text-neutral-900 rounded-lg text-xs font-bold hover:bg-white transition-colors"
                >
                  Remplacer
                </button>
                <button
                  onClick={() => store.setMainImage(null)}
                  className="px-3 py-1.5 bg-red-500/90 text-white rounded-lg text-xs font-bold hover:bg-red-500 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            {...mainDropzone.getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all max-w-lg",
              mainDropzone.isDragActive
                ? "border-primary bg-primary/5"
                : "border-white/20 hover:border-primary/50 hover:bg-white/[0.02]"
            )}
          >
            <input {...mainDropzone.getInputProps()} />
            <span className="material-symbols-outlined text-4xl text-slate-500 mb-3 block">
              add_photo_alternate
            </span>
            <p className="text-sm font-semibold mb-1">
              Glissez-déposez votre image ici
            </p>
            <p className="text-xs text-slate-500">ou cliquez pour parcourir</p>
          </div>
        )}
      </div>

      {/* Additional images */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Images supplémentaires
          <span className="text-slate-500 font-normal ml-1">
            ({store.additionalImages.length}/{MAX_ADDITIONAL_IMAGES})
          </span>
        </label>

        {store.additionalImages.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={store.additionalImages.map((i) => i.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {store.additionalImages.map((image) => (
                  <SortableThumbnail
                    key={image.id}
                    image={image}
                    onRemove={() => store.removeAdditionalImage(image.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {store.additionalImages.length < MAX_ADDITIONAL_IMAGES && (
          <div
            {...additionalDropzone.getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
              additionalDropzone.isDragActive
                ? "border-primary bg-primary/5"
                : "border-white/10 hover:border-primary/30 hover:bg-white/[0.02]"
            )}
          >
            <input {...additionalDropzone.getInputProps()} />
            <span className="material-symbols-outlined text-2xl text-slate-500 mb-1 block">
              add
            </span>
            <p className="text-xs text-slate-400">Ajouter des images</p>
          </div>
        )}
      </div>

      {/* Video */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Vidéo <span className="text-slate-500 font-normal">(optionnel)</span>
        </label>
        <input
          type="url"
          value={store.videoUrl}
          onChange={(e) => store.updateField("videoUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {store.videoUrl && !videoInfo && (
          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            URL non reconnue. Utilisez un lien YouTube ou Vimeo.
          </p>
        )}
        {videoInfo && (
          <div className="mt-3 rounded-xl overflow-hidden border border-white/10 max-w-lg aspect-video">
            <iframe
              src={
                videoInfo.provider === "youtube"
                  ? `https://www.youtube-nocookie.com/embed/${videoInfo.id}`
                  : `https://player.vimeo.com/video/${videoInfo.id}`
              }
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Aperçu vidéo"
            />
          </div>
        )}
      </div>

      {/* Upload status */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Upload en cours...
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {uploadError}
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/5">
        <button
          onClick={() => store.setStep(6)}
          className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Précédent
        </button>
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Enregistrer et suivant
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
