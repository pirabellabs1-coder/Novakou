"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  X,
} from "lucide-react";
import { useToastStore } from "@/store/toast";
import {
  KazaHero,
  KazaCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

interface Pack {
  id: string;
  title: string;
  sessionsCount: number;
  priceXof: number;
  sessionDurationMinutes: number;
  description: string | null;
  isActive: boolean;
  validityDays: number;
  createdAt: string;
  _count?: { purchases: number };
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function pricePerSession(p: Pack): number {
  return p.sessionsCount > 0 ? Math.round(p.priceXof / p.sessionsCount) : 0;
}

export default function MentorPacksPage() {
  const toast = useToastStore.getState().addToast;
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [sessionsCount, setSessionsCount] = useState(5);
  const [priceXof, setPriceXof] = useState(100_000);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);
  const [description, setDescription] = useState("");
  const [validityDays, setValidityDays] = useState(180);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/mentor/packs");
      const j = await res.json();
      setPacks(Array.isArray(j.data) ? j.data : []);
    } catch {
      toast("error", "Impossible de charger vos packs.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast("warning", "Donnez un titre au pack."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/formations/mentor/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sessionsCount,
          priceXof,
          sessionDurationMinutes,
          description: description.trim(),
          validityDays,
        }),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error || "Création impossible."); return; }
      toast("success", "Pack créé");
      setTitle(""); setDescription("");
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto space-y-8">
        <KazaHero
          badge="Mentor"
          badgeColor="white"
          icon={Package}
          title="Packs de sessions"
          subtitle="Proposez 3, 5 ou 10 séances d'un coup à prix dégressif — revenus d'avance + fidélisation."
          actions={
            <KazaButton
              variant="primary"
              icon={showForm ? X : Plus}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Fermer" : "Nouveau pack"}
            </KazaButton>
          }
        />

        {showForm && (
          <KazaCard title="Créer un pack">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Pack Transformation — 5 séances"
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de séances</label>
                  <input
                    type="number" min={2} max={50}
                    value={sessionsCount}
                    onChange={(e) => setSessionsCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Durée/séance (min)</label>
                  <input
                    type="number" min={15} max={240}
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Validité (jours)</label>
                  <input
                    type="number" min={30} max={730}
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Prix total (FCFA)</label>
                <input
                  type="number" min={500}
                  value={priceXof}
                  onChange={(e) => setPriceXof(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Soit {fmtFCFA(sessionsCount > 0 ? priceXof / sessionsCount : 0)} par séance
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (optionnelle)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <KazaButton variant="primary" type="submit" disabled={saving}>
                  {saving ? "Création…" : "Créer le pack"}
                </KazaButton>
                <KazaButton variant="ghost" type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </KazaButton>
              </div>
            </form>
          </KazaCard>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : packs.length === 0 ? (
          <KazaEmpty
            icon={Package}
            title="Aucun pack pour le moment"
            description="Créez votre premier pack pour offrir un tarif dégressif à vos apprenants."
            action={!showForm ? { label: "Créer un pack", onClick: () => setShowForm(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <KazaBadge variant="green">{p.sessionsCount} séances</KazaBadge>
                  <KazaBadge variant={p.isActive ? "green" : "slate"}>
                    {p.isActive ? "Actif" : "Masqué"}
                  </KazaBadge>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2">{p.title}</h3>
                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                )}
                <div className="pt-3 border-t border-slate-100 flex items-baseline gap-1.5 mb-1">
                  <span className="text-xl font-extrabold text-slate-900 tabular-nums">{fmtFCFA(p.priceXof)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{fmtFCFA(pricePerSession(p))} / séance</span>
                  <span>{p.sessionDurationMinutes} min · {p.validityDays}j</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{p._count?.purchases ?? 0} ventes</span>
                  <span className="text-emerald-700 font-bold">
                    {fmtFCFA((p._count?.purchases ?? 0) * p.priceXof)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
