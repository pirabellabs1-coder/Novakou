"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

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

  // Form state
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
      toast("success", "Pack créé ✓");
      setTitle(""); setDescription("");
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
              Monétisation
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Packs de sessions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Proposez 3, 5 ou 10 séances d&apos;un coup à prix dégressif — revenus d&apos;avance + fidélisation.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add_circle"}</span>
            {showForm ? "Fermer" : "Nouveau pack"}
          </button>
        </header>

        {showForm && (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Créer un pack</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Pack Transformation — 5 séances"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Durée/séance (min)</label>
                <input
                  type="number" min={15} max={240}
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Validité (jours)</label>
                <input
                  type="number" min={30} max={730}
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Prix total (FCFA)</label>
              <input
                type="number" min={500}
                value={priceXof}
                onChange={(e) => setPriceXof(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                {saving ? "Création…" : "Créer le pack"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : packs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
            <p className="text-base font-bold text-slate-700 mt-3">Aucun pack pour le moment</p>
            <p className="text-sm text-slate-500 mt-1">
              Créez votre premier pack pour offrir un tarif dégressif à vos apprenants.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    {p.sessionsCount} séances
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {p.isActive ? "Actif" : "Masqué"}
                  </span>
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
