"use client";
import { useToastStore } from "@/store/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  Facebook,
  Chrome,
  Music,
  Info,
  Pencil,
  Trash2,
  PlusCircle,
  ChevronRight,
  Eye,
  ShoppingCart,
  CreditCard,
  UserPlus,
  GraduationCap,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

type Pixel = {
  id: string;
  type: "FACEBOOK" | "GOOGLE" | "TIKTOK";
  pixelId: string;
  isActive: boolean;
  createdAt: string;
};

const PIXEL_CONFIG: Record<string, { label: string; icon: LucideIcon; bg: string; color: string; placeholder: string; description: string }> = {
  FACEBOOK: {
    label: "Facebook / Meta Pixel",
    icon: Facebook,
    bg: "bg-blue-50",
    color: "text-blue-600",
    placeholder: "123456789012345",
    description: "Suivez les conversions Facebook Ads et créez des audiences personnalisées pour vos publicités.",
  },
  GOOGLE: {
    label: "Google Analytics / Tag Manager",
    icon: Chrome,
    bg: "bg-red-50",
    color: "text-red-500",
    placeholder: "G-XXXXXXXXXX ou GTM-XXXXXXX",
    description: "Mesurez les conversions Google Ads et suivez votre audience avec Google Analytics 4.",
  },
  TIKTOK: {
    label: "TikTok Pixel",
    icon: Music,
    bg: "bg-[#010101]/5",
    color: "text-[#010101]",
    placeholder: "CXXXXXXXXXXXXXXXXX",
    description: "Optimisez vos campagnes TikTok Ads et suivez les achats depuis l'application.",
  },
};

export default function PixelsPage() {
  const qc = useQueryClient();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [pixelInputs, setPixelInputs] = useState<Record<string, string>>({});

  const { data: response, isLoading } = useQuery<{ data: Pixel[] }>({
    queryKey: ["vendeur-pixels"],
    queryFn: () => fetch("/api/formations/vendeur/marketing/pixels").then((r) => r.json()),
    staleTime: 60_000,
  });

  const pixels = response?.data ?? [];
  const pixelMap = Object.fromEntries(pixels.map((p) => [p.type, p]));

  const saveMutation = useMutation({
    mutationFn: (body: { type: string; pixelId: string }) =>
      fetch("/api/formations/vendeur/marketing/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      qc.invalidateQueries({ queryKey: ["vendeur-pixels"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      setEditingType(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (type: string) =>
      fetch(`/api/formations/vendeur/marketing/pixels?type=${type}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-pixels"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
    },
  });

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
          <a href="/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">Marketing</a>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#191c1e] font-medium">Pixels & Tracking</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Pixels & Tracking</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          Connectez vos outils de tracking pour suivre les conversions et optimiser vos publicités.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-8">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Comment ça fonctionne</p>
          <p className="text-[12px] text-blue-700 mt-0.5">
            Une fois configuré, votre pixel se déclenche automatiquement sur les événements clés : vue d'une page de formation, ajout au panier, achat complété. Ces données remontent directement dans votre gestionnaire de publicités.
          </p>
        </div>
      </div>

      {/* Pixel cards */}
      <div className="space-y-4">
        {(["FACEBOOK", "GOOGLE", "TIKTOK"] as const).map((type) => {
          const cfg = PIXEL_CONFIG[type];
          const CfgIcon = cfg.icon;
          const existing = pixelMap[type];
          const isEditing = editingType === type;

          return (
            <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <CfgIcon className={`w-[22px] h-[22px] ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-[#191c1e] text-sm">{cfg.label}</h3>
                    {existing ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006e2f]" />
                        Configuré
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">
                        Non configuré
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5c647a] leading-snug">{cfg.description}</p>

                  {existing && !isEditing && (
                    <div className="flex items-center gap-2 mt-3">
                      <code className="text-xs tabular-nums bg-gray-100 px-2.5 py-1 rounded-lg text-[#191c1e] flex-1 truncate">
                        {existing.pixelId}
                      </code>
                      <button
                        onClick={() => { setEditingType(type); setPixelInputs((p) => ({ ...p, [type]: existing.pixelId })); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await confirmAction({
                            title: "Supprimer ce pixel ?",
                            message: "Le tracking sera désactivé pour ce canal.",
                            confirmLabel: "Supprimer",
                            confirmVariant: "danger",
                            icon: "delete",
                          });
                          if (ok) deleteMutation.mutate(type);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={pixelInputs[type] ?? ""}
                        onChange={(e) => setPixelInputs((p) => ({ ...p, [type]: e.target.value }))}
                        placeholder={cfg.placeholder}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm tabular-nums text-[#191c1e] placeholder-[#5c647a]/50 focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                      />
                      <button
                        onClick={() => saveMutation.mutate({ type, pixelId: pixelInputs[type] ?? "" })}
                        disabled={!pixelInputs[type]?.trim() || saveMutation.isPending}
                        className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                      >
                        {saveMutation.isPending ? "…" : "Sauvegarder"}
                      </button>
                      <button onClick={() => setEditingType(null)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#5c647a] hover:bg-gray-50">
                        Annuler
                      </button>
                    </div>
                  )}

                  {!existing && !isEditing && (
                    <button
                      onClick={() => { setEditingType(type); setPixelInputs((p) => ({ ...p, [type]: "" })); }}
                      className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#006e2f] hover:underline"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Connecter
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Events tracked */}
      <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-[#191c1e] mb-3">Événements suivis automatiquement</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { icon: Eye, label: "Vue formation" },
            { icon: ShoppingCart, label: "Ajout au panier" },
            { icon: CreditCard, label: "Achat complété" },
            { icon: UserPlus, label: "Inscription" },
            { icon: GraduationCap, label: "Leçon commencée" },
            { icon: BadgeCheck, label: "Cours terminé" },
          ].map((ev) => {
            const EvIcon = ev.icon;
            return (
              <div key={ev.label} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2">
                <EvIcon className="w-4 h-4 text-[#006e2f]" />
                <span className="text-[11px] font-medium text-[#191c1e]">{ev.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
