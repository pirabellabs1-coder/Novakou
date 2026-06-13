// Refonte design "Stitch" — packs mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : query packs, formulaire de création, calcul prix/séance.
"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  X,
} from "lucide-react";
import { useToastStore } from "@/store/toast";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StStatusPill,
  StInput,
  StTextarea,
  ST,
} from "@/components/stitch";

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Packs de sessions"
          subtitle="Proposez 3, 5 ou 10 séances d'un coup à prix dégressif — revenus d'avance + fidélisation."
          actions={
            <StButton
              icon={showForm ? X : Plus}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Fermer" : "Nouveau pack"}
            </StButton>
          }
        />

        {showForm && (
          <StCard className="mb-4 !p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Créer un pack</span>
            <form onSubmit={submit} className="space-y-4">
              <StInput
                label="Titre"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Pack Transformation — 5 séances"
                maxLength={80}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StInput
                  label="Nombre de séances"
                  type="number"
                  min={2}
                  max={50}
                  value={sessionsCount}
                  onChange={(e) => setSessionsCount(Number(e.target.value))}
                />
                <StInput
                  label="Durée/séance (min)"
                  type="number"
                  min={15}
                  max={240}
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                />
                <StInput
                  label="Validité (jours)"
                  type="number"
                  min={30}
                  max={730}
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                />
              </div>
              <StInput
                label="Prix total (FCFA)"
                type="number"
                min={500}
                value={priceXof}
                onChange={(e) => setPriceXof(Number(e.target.value))}
                hint={`Soit ${fmtFCFA(sessionsCount > 0 ? priceXof / sessionsCount : 0)} par séance`}
              />
              <StTextarea
                label="Description (optionnelle)"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${ST.divider}` }}>
                <StButton type="submit" disabled={saving}>
                  {saving ? "Création…" : "Créer le pack"}
                </StButton>
                <StButton variant="secondary" type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </StButton>
              </div>
            </form>
          </StCard>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-[18px] animate-pulse" style={{ background: "#e9efeb" }} />)}
          </div>
        ) : packs.length === 0 ? (
          <StCard className="text-center py-12">
            <Package size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>Aucun pack pour le moment</p>
            <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              Créez votre premier pack pour offrir un tarif dégressif à vos apprenants.
            </p>
            {!showForm && (
              <div className="mt-4">
                <StButton icon={Plus} onClick={() => setShowForm(true)}>Créer un pack</StButton>
              </div>
            )}
          </StCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((p) => (
              <StCard key={p.id} className="transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <StChip tone="green">{p.sessionsCount} séances</StChip>
                  <StStatusPill status={p.isActive ? "ACTIF" : "ARCHIVE"} label={p.isActive ? "Actif" : "Masqué"} />
                </div>
                <h3 className="text-[14px] font-extrabold leading-snug mb-2 line-clamp-2" style={{ color: ST.text }}>{p.title}</h3>
                {p.description && (
                  <p className="text-[11.5px] font-semibold line-clamp-2 mb-3" style={{ color: ST.textSecondary }}>{p.description}</p>
                )}
                <div className="pt-3 flex items-baseline gap-1.5 mb-1" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <span className="text-[19px] font-extrabold tabular-nums" style={{ color: ST.text }}>{fmtFCFA(p.priceXof)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: ST.textMuted }}>
                  <span>{fmtFCFA(pricePerSession(p))} / séance</span>
                  <span>{p.sessionDurationMinutes} min · {p.validityDays}j</span>
                </div>
                <div className="mt-3 pt-3 flex items-center justify-between text-[11px]" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <span className="font-semibold" style={{ color: ST.textMuted }}>{p._count?.purchases ?? 0} ventes</span>
                  <span className="font-extrabold" style={{ color: ST.green }}>
                    {fmtFCFA((p._count?.purchases ?? 0) * p.priceXof)}
                  </span>
                </div>
              </StCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
