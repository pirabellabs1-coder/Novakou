"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ShopDomainPanel from "@/components/formations/ShopDomainPanel";
import { useToastStore } from "@/store/toast";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  isPrimary: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
}

export default function VendorShopDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToastStore.getState().addToast;

  async function load() {
    try {
      const res = await fetch(`/api/formations/vendeur/shops/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setShop(json.data);
      setName(json.data.name ?? "");
      setDescription(json.data.description ?? "");
      setThemeColor(json.data.themeColor ?? "");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/shops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          themeColor: themeColor || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast("error", json.error ?? "Erreur");
        return;
      }
      toast("success", "Boutique mise à jour");
      setShop(json.data);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-8">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded" />
          <div className="h-48 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-gray-300">storefront</span>
          <p className="text-base font-bold text-[#191c1e] mt-3">Boutique introuvable</p>
          <Link
            href="/vendeur/boutiques"
            className="inline-block mt-4 text-sm font-semibold text-[#006e2f]"
          >
            ← Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/vendeur/boutiques" className="text-sm font-semibold text-[#5c647a] hover:text-[#191c1e] inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Mes boutiques
          </Link>
          <a
            href={shop.customDomain && shop.customDomainVerified ? `https://${shop.customDomain}` : `https://novakou.com/boutique/${shop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#006e2f] hover:underline inline-flex items-center gap-1.5"
          >
            Voir la boutique
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>

        {/* Identity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-base font-extrabold text-[#191c1e]">Identité de la boutique</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Slug (URL Novakou)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5c647a] font-mono">novakou.com/boutique/</span>
              <code className="text-sm text-[#191c1e] font-mono px-2 py-1 bg-gray-100 rounded">{shop.slug}</code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Présentez votre boutique en quelques phrases…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
              Couleur principale (hex)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#006e2f"
                maxLength={7}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] font-mono focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              />
              <div
                className="w-12 h-12 rounded-xl border border-gray-200"
                style={{ background: themeColor || "#006e2f" }}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Domain panel (per-shop) */}
        <ShopDomainPanel shopId={shop.id} />
      </div>
    </div>
  );
}
