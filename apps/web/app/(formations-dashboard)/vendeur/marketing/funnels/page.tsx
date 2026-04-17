"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FunnelStep {
  id: string;
  stepOrder: number;
  stepType: string;
  title: string;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  totalViews: number;
  totalConversions: number;
  totalRevenue: number;
  steps: FunnelStep[];
  updatedAt: string;
  _count?: { events: number };
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 30) return `Il y a ${d}j`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

export default function FunnelsListPage() {
  const router = useRouter();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/vendeur/funnels");
      const json = await res.json();
      setFunnels(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/formations/vendeur/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Erreur lors de la création");
      }
      const json = await res.json();
      router.push(`/vendeur/marketing/funnels/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setCreating(false);
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
            <Link href="/vendeur/marketing" className="hover:text-[#006e2f] transition-colors">
              Marketing
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#191c1e] font-medium">Funnels de vente</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes funnels de vente</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Créez des tunnels de vente complets : landing, checkout, upsell, page de remerciement.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau funnel
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #006e2f15, #22c55e15)" }}
          >
            <span
              className="material-symbols-outlined text-[#006e2f] text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_tree
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Lancez votre premier funnel</h2>
          <p className="text-sm text-[#5c647a] max-w-md mx-auto mb-6 leading-relaxed">
            Un funnel de vente, c&apos;est un parcours optimisé qui guide vos visiteurs depuis la découverte
            jusqu&apos;à l&apos;achat — avec upsells et page de remerciement personnalisée.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Créer mon premier funnel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnels.map((f) => {
            const conversionRate = f.totalViews > 0 ? (f.totalConversions / f.totalViews) * 100 : 0;
            return (
              <Link
                key={f.id}
                href={`/vendeur/marketing/funnels/${f.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#006e2f]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-extrabold text-[#191c1e] truncate">{f.name}</h3>
                      {f.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                          Brouillon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5c647a] truncate">/{f.slug}</p>
                  </div>
                  <span className="material-symbols-outlined text-[#5c647a] group-hover:text-[#006e2f] transition-colors">
                    arrow_forward
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-4 overflow-x-auto">
                  {f.steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f] whitespace-nowrap">
                        {s.title}
                      </span>
                      {i < f.steps.length - 1 && (
                        <span className="material-symbols-outlined text-gray-300 text-[14px]">
                          arrow_forward
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-[#5c647a] font-semibold uppercase">Vues</p>
                    <p className="text-sm font-extrabold text-[#191c1e]">{fmt(f.totalViews)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5c647a] font-semibold uppercase">Conv.</p>
                    <p className="text-sm font-extrabold text-[#191c1e]">{fmt(f.totalConversions)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5c647a] font-semibold uppercase">Taux</p>
                    <p className="text-sm font-extrabold text-[#006e2f]">{conversionRate.toFixed(1)}%</p>
                  </div>
                </div>

                <p className="text-[10px] text-[#5c647a] mt-3">Modifié {timeAgo(f.updatedAt)}</p>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !creating && setShowCreate(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Nouveau funnel de vente</h2>
            <p className="text-sm text-[#5c647a] mb-5">
              Donnez un nom à votre funnel. Vous pourrez tout configurer ensuite (design, blocks, produits).
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nom du funnel</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ex: Lancement formation marketing 2026"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
            />

            <div className="bg-[#006e2f]/5 border border-[#006e2f]/20 rounded-xl p-3 mt-4 mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[#006e2f] text-[16px] mt-0.5">info</span>
              <p className="text-xs text-[#006e2f]">
                Votre funnel sera créé avec 4 étapes par défaut :{" "}
                <strong>Landing → Checkout → Upsell → Merci</strong>. Vous pourrez tout personnaliser.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {creating ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Création…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
