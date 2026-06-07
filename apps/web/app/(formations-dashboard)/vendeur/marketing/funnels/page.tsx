"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Network,
  Sparkles,
  Plus,
  ArrowRight,
  Loader2,
  PlusCircle,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Mes funnels de vente"
        subtitle="Tunnels complets : landing, checkout, upsell et page de remerciement"
        icon={Network}
        actions={
          <>
            <KazaButton variant="secondary" href="/vendeur/marketing/funnels/nouveau-ai" icon={Sparkles}>
              Générer avec l&apos;IA
            </KazaButton>
            <KazaButton variant="primary" onClick={() => setShowCreate(true)} icon={Plus}>
              Nouveau funnel
            </KazaButton>
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <KazaEmpty
          icon={Network}
          title="Lancez votre premier funnel"
          description="Un funnel de vente guide vos visiteurs depuis la découverte jusqu'à l'achat avec upsells et page de remerciement personnalisée."
          action={{ label: "Générer avec l'IA", href: "/vendeur/marketing/funnels/nouveau-ai" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnels.map((f) => {
            const conversionRate = f.totalViews > 0 ? (f.totalConversions / f.totalViews) * 100 : 0;
            return (
              <Link
                key={f.id}
                href={`/vendeur/marketing/funnels/${f.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-extrabold text-[#0b2540] truncate">{f.name}</h3>
                      {f.isActive ? (
                        <KazaBadge variant="green">Actif</KazaBadge>
                      ) : (
                        <KazaBadge variant="slate">Brouillon</KazaBadge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">/{f.slug}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center gap-1 mb-4 overflow-x-auto">
                  {f.steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
                        {s.title}
                      </span>
                      {i < f.steps.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Vues</p>
                    <p className="text-sm font-extrabold text-[#0b2540]">{fmt(f.totalViews)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Conv.</p>
                    <p className="text-sm font-extrabold text-[#0b2540]">{fmt(f.totalConversions)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Taux</p>
                    <p className="text-sm font-extrabold text-emerald-600">{conversionRate.toFixed(1)}%</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-3">Modifié {timeAgo(f.updatedAt)}</p>
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
            <h2 className="text-xl font-extrabold text-[#0b2540] mb-2">Nouveau funnel de vente</h2>
            <p className="text-sm text-slate-500 mb-5">
              Donnez un nom à votre funnel. Vous pourrez tout configurer ensuite (design, blocks, produits).
            </p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom du funnel</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ex: Lancement formation marketing 2026"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
            />

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-4 mb-5 flex items-start gap-2">
              <Info size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700">
                Votre funnel sera créé avec 4 étapes par défaut :{" "}
                <strong>Landing → Checkout → Upsell → Merci</strong>. Vous pourrez tout personnaliser.
              </p>
            </div>

            <div className="flex gap-2">
              <KazaButton variant="ghost" className="flex-1" onClick={() => setShowCreate(false)} disabled={creating}>
                Annuler
              </KazaButton>
              <KazaButton
                variant="primary"
                className="flex-1"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                icon={creating ? Loader2 : PlusCircle}
              >
                {creating ? "Création…" : "Créer"}
              </KazaButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
