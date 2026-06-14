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
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StInput,
  StSectionTitle,
  ST,
} from "@/components/stitch";

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Mes boutiques"
          subtitle={`Créez jusqu'à ${max} boutiques avec leur propre nom de domaine. Vos produits apparaissent dans toutes vos boutiques.`}
        />

        {/* Create form */}
        {shops.length < max && (
          <StCard className="mb-4">
            <StSectionTitle>Nouvelle boutique</StSectionTitle>
            <p className="text-[12px] font-semibold -mt-2 mb-3" style={{ color: ST.textSecondary }}>Donnez-lui un nom mémorable</p>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <StInput
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Tools IA Pro"
                  maxLength={80}
                />
              </div>
              <StButton
                type="submit"
                icon={Plus}
                disabled={creating || newName.trim().length < 2}
              >
                {creating ? "Création…" : "Créer la boutique"}
              </StButton>
            </form>
          </StCard>
        )}

        {/* Shops list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-[18px]" style={{ background: "#f3f6f4" }} />
            <div className="h-24 rounded-[18px]" style={{ background: "#f3f6f4" }} />
          </div>
        ) : shops.length === 0 ? (
          <StCard className="text-center py-12">
            <Store size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
            <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune boutique encore</h3>
            <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Créez votre première boutique pour publier votre catalogue sous votre propre marque.
            </p>
          </StCard>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {shops.map((s) => (
              <StCard
                key={s.id}
                className="flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-[12px] flex items-center justify-center text-white font-extrabold text-base flex-shrink-0"
                    style={{ background: s.themeColor || ST.gradient }}
                  >
                    {s.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-extrabold truncate" style={{ color: ST.text }}>{s.name}</p>
                      {s.isPrimary && (
                        <StChip tone="green" icon={Star}>Principale</StChip>
                      )}
                      {s.customDomainVerified && (
                        <StChip tone="blue" icon={BadgeCheck}>Domaine vérifié</StChip>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] font-semibold mt-1 flex-wrap" style={{ color: ST.textSecondary }}>
                      <a
                        href={`https://novakou.com/boutique/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <LinkIcon className="w-3 h-3" />
                        novakou.com/boutique/{s.slug}
                      </a>
                      {s.customDomain && (
                        <a
                          href={`https://${s.customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          {s.customDomain}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StButton variant="secondary" size="sm" icon={Settings} href={`/vendeur/boutiques/${s.id}`}>
                    Gérer
                  </StButton>
                  {!s.isPrimary && (
                    <>
                      <StButton variant="secondary" size="sm" icon={Star} onClick={() => handleSetPrimary(s.id)}>
                        Principale
                      </StButton>
                      <StButton variant="secondary" size="sm" icon={Trash2} onClick={() => handleDelete(s.id, s.name)} className="!text-[#993556]">
                        Supprimer
                      </StButton>
                    </>
                  )}
                </div>
              </StCard>
            ))}
          </div>
        )}

        <p className="text-[12px] font-semibold text-center mt-4" style={{ color: ST.textSecondary }}>
          {shops.length}/{max} boutiques utilisées
        </p>
      </main>
    </div>
  );
}
