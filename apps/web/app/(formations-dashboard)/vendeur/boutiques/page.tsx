"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Plus,
  Settings,
  Trash2,
  Link as LinkIcon,
  Globe,
  Star,
  BadgeCheck,
} from "lucide-react";
import { useToastStore } from "@/store/toast";
import {
  KazaHero,
  KazaCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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
      const list = (json.data?.shops ?? []) as Shop[];
      setShops(list);
      setMax(json.data?.max ?? 5);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto space-y-8">
        <KazaHero
          badge="Pro"
          badgeColor="orange"
          icon={Store}
          title="Mes boutiques"
          subtitle={`Créez jusqu'à ${max} boutiques avec leur propre nom de domaine. Vos produits apparaissent dans toutes vos boutiques.`}
        />

        {/* Create form */}
        {shops.length < max && (
          <KazaCard title="Nouvelle boutique" subtitle="Donnez-lui un nom mémorable">
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Tools IA Pro"
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
              </div>
              <KazaButton
                type="submit"
                variant="primary"
                icon={Plus}
                disabled={creating || newName.trim().length < 2}
              >
                {creating ? "Création…" : "Créer la boutique"}
              </KazaButton>
            </form>
          </KazaCard>
        )}

        {/* Shops list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-white rounded-2xl border border-slate-100" />
            <div className="h-24 bg-white rounded-2xl border border-slate-100" />
          </div>
        ) : shops.length === 0 ? (
          <KazaEmpty
            icon={Store}
            title="Aucune boutique encore"
            description="Créez votre première boutique pour publier votre catalogue sous votre propre marque."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {shops.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base flex-shrink-0"
                    style={{ background: s.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    {s.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-extrabold text-slate-900 truncate">{s.name}</p>
                      {s.isPrimary && (
                        <KazaBadge variant="green" icon={Star}>Principale</KazaBadge>
                      )}
                      {s.customDomainVerified && (
                        <KazaBadge variant="blue" icon={BadgeCheck}>Domaine vérifié</KazaBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <a
                        href={`https://novakou.com/boutique/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        novakou.com/boutique/{s.slug}
                      </a>
                      {s.customDomain && (
                        <a
                          href={`https://${s.customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-700 inline-flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {s.customDomain}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <KazaButton variant="ghost" size="sm" icon={Settings} href={`/vendeur/boutiques/${s.id}`}>
                    Gérer
                  </KazaButton>
                  {!s.isPrimary && (
                    <>
                      <KazaButton variant="ghost" size="sm" icon={Star} onClick={() => handleSetPrimary(s.id)}>
                        Principale
                      </KazaButton>
                      <KazaButton variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(s.id, s.name)}>
                        Supprimer
                      </KazaButton>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500 text-center">
          {shops.length}/{max} boutiques utilisées
        </p>
      </main>
    </div>
  );
}
