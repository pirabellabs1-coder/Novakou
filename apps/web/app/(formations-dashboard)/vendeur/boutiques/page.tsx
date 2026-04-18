"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";

interface Shop {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  logoUrl: string | null;
  themeColor: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  createdAt: string;
}

export default function VendorShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [max, setMax] = useState(5);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const toast = useToastStore.getState().addToast;

  async function load() {
    try {
      const res = await fetch("/api/formations/vendeur/shops");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setShops(json.data?.shops ?? []);
      setMax(json.data?.max ?? 5);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim().length < 2 || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/formations/vendeur/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast("error", json.error ?? "Création impossible");
        return;
      }
      toast("success", "Boutique créée");
      setNewName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleSetPrimary(id: string) {
    const res = await fetch(`/api/formations/vendeur/shops/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrimary: true }),
    });
    if (res.ok) {
      toast("success", "Boutique principale mise à jour");
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast("error", j.error ?? "Erreur");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer la boutique "${name}" ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/formations/vendeur/shops/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("success", "Boutique supprimée");
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast("error", j.error ?? "Suppression impossible");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes boutiques</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Créez jusqu&apos;à {max} boutiques avec leur propre nom de domaine. Les produits de votre catalogue
            apparaissent dans toutes vos boutiques.
          </p>
        </div>

        {/* Create form */}
        {shops.length < max && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-end"
          >
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c647a] mb-1.5">
                Nom de la nouvelle boutique
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Tools IA Pro"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              />
            </div>
            <button
              type="submit"
              disabled={creating || newName.trim().length < 2}
              className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {creating ? "Création…" : "Créer"}
            </button>
          </form>
        )}

        {/* Shops list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-white rounded-2xl border border-gray-100" />
            <div className="h-24 bg-white rounded-2xl border border-gray-100" />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-5xl text-gray-300">storefront</span>
            <p className="text-base font-bold text-[#191c1e] mt-3">Aucune boutique encore</p>
            <p className="text-sm text-[#5c647a] mt-1">Créez votre première boutique ci-dessus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {shops.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base flex-shrink-0"
                    style={{ background: s.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    {s.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-extrabold text-[#191c1e] truncate">{s.name}</p>
                      {s.isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                          Principale
                        </span>
                      )}
                      {s.customDomainVerified && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Domaine vérifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#5c647a] mt-1 flex-wrap">
                      <a
                        href={`https://novakou.com/boutique/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#006e2f] inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">link</span>
                        novakou.com/boutique/{s.slug}
                      </a>
                      {s.customDomain && (
                        <a
                          href={`https://${s.customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#006e2f] inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">public</span>
                          {s.customDomain}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/vendeur/boutiques/${s.id}`}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    Gérer
                  </Link>
                  {!s.isPrimary && (
                    <>
                      <button
                        onClick={() => handleSetPrimary(s.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#006e2f]/5 text-[#006e2f] hover:bg-[#006e2f]/10"
                      >
                        Principale
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50"
                        aria-label="Supprimer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[#5c647a] mt-6 text-center">
          {shops.length}/{max} boutiques utilisées
        </p>
      </div>
    </div>
  );
}
