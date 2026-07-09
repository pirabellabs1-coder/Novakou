"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { promptAction } from "@/store/prompt";
import {
  Network,
  Sparkles,
  Plus,
  Download,
  ArrowRight,
  Loader2,
  PlusCircle,
  Info,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";

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
  const [newKind, setNewKind] = useState<"funnel" | "capture">("funnel");
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
        body: JSON.stringify({ name: newName.trim(), kind: newKind }),
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

  const [duplicating, setDuplicating] = useState<string | null>(null);
  async function handleDuplicate(e: React.MouseEvent, funnelId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (duplicating) return;
    setDuplicating(funnelId);
    try {
      const res = await fetch(`/api/formations/vendeur/funnels/${funnelId}/duplicate`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Duplication échouée");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplication échouée");
    } finally {
      setDuplicating(null);
    }
  }

  async function importFromSysteme() {
    const url = await promptAction({
      title: "Importer depuis Systeme.io",
      message: "Collez l'URL PUBLIQUE de votre page (celle que voient vos visiteurs). Tout est importé : titres, textes, listes, images, boutons, vidéos, formulaire — AVEC les couleurs, fonds et tailles d'origine. Tunnel à plusieurs pages ? Collez plusieurs URLs séparées par des espaces : chaque page devient une étape.",
      placeholder: "https://votre-funnel.systeme.io/page-1 https://…/page-2",
      confirmLabel: "Importer",
      cancelLabel: "Annuler",
      icon: "download",
      validate: (s) => (!/^https?:\/\/.+/.test(s.trim()) ? "Entrez une URL complète (https://…)." : null),
    });
    if (url === null) return;
    try {
      const res = await fetch("/api/marketing/funnels/import-systeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import échoué");
      router.push(`/vendeur/marketing/funnels/${j.funnelId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import échoué");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Mes funnels de vente"
          subtitle="Tunnels complets : landing, checkout, upsell et page de remerciement"
          actions={
            <>
              <StButton variant="secondary" onClick={importFromSysteme} icon={Download}>
                Importer Systeme.io
              </StButton>
              <StButton variant="secondary" href="/vendeur/marketing/funnels/nouveau-ai" icon={Sparkles}>
                Générer avec l&apos;IA
              </StButton>
              <StButton onClick={() => setShowCreate(true)} icon={Plus}>
                Nouveau funnel
              </StButton>
            </>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-[18px]" style={{ background: "#f3f6f4" }} />
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <StCard className="text-center py-12">
            <Network size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
            <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Lancez votre premier funnel</h3>
            <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Un funnel de vente guide vos visiteurs depuis la découverte jusqu&apos;à l&apos;achat avec upsells et page de remerciement personnalisée.
            </p>
            <div className="mt-4 flex justify-center">
              <StButton href="/vendeur/marketing/funnels/nouveau-ai" icon={Sparkles}>Générer avec l&apos;IA</StButton>
            </div>
          </StCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {funnels.map((f) => {
              const conversionRate = f.totalViews > 0 ? (f.totalConversions / f.totalViews) * 100 : 0;
              return (
                <Link
                  key={f.id}
                  href={`/vendeur/marketing/funnels/${f.id}`}
                  className="block group"
                >
                  <StCard className="transition-transform hover:-translate-y-0.5 h-full">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-[15px] font-extrabold truncate" style={{ color: ST.text }}>{f.name}</h3>
                          {f.isActive ? (
                            <StChip tone="green">Actif</StChip>
                          ) : (
                            <StChip tone="neutral">Brouillon</StChip>
                          )}
                        </div>
                        <p className="text-[12px] font-semibold truncate" style={{ color: ST.textSecondary }}>/{f.slug}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(e, f.id)}
                          disabled={duplicating !== null}
                          title="Dupliquer ce tunnel (copie en brouillon)"
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
                          style={{ color: ST.textFaint }}
                        >
                          {duplicating === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <ArrowRight className="w-5 h-5 transition-colors" style={{ color: ST.textFaint }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-4 overflow-x-auto">
                      {f.steps.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: ST.greenSoft, color: ST.green }}>
                            {s.title}
                          </span>
                          {i < f.steps.length - 1 && (
                            <ArrowRight className="w-3 h-3" style={{ color: "#cdd9d1" }} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase" style={{ color: ST.textMuted }}>Vues</p>
                        <p className="text-[13.5px] font-extrabold tabular-nums" style={{ color: ST.text }}>{fmt(f.totalViews)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase" style={{ color: ST.textMuted }}>Conv.</p>
                        <p className="text-[13.5px] font-extrabold tabular-nums" style={{ color: ST.text }}>{fmt(f.totalConversions)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold uppercase" style={{ color: ST.textMuted }}>Taux</p>
                        <p className="text-[13.5px] font-extrabold tabular-nums" style={{ color: ST.green }}>{conversionRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <p className="text-[10.5px] font-semibold mt-3" style={{ color: ST.textFaint }}>Modifié {timeAgo(f.updatedAt)}</p>
                  </StCard>
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
              className="bg-white rounded-[20px] max-w-md w-full p-7 shadow-2xl"
              style={{ border: `1px solid ${ST.cardBorder}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-[19px] font-extrabold mb-2" style={{ color: ST.text }}>Créer une nouvelle page</h2>
              <p className="text-[13px] font-semibold mb-4" style={{ color: ST.textSecondary }}>
                Choisissez le type, donnez un nom — vous personnalisez tout ensuite (design, blocs, produits).
              </p>

              {/* Choix du type : tunnel complet OU page de capture seule */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button type="button" onClick={() => setNewKind("funnel")}
                  className={`text-left rounded-[14px] p-3.5 border-2 transition-all ${newKind === "funnel" ? "shadow-md" : "opacity-70 hover:opacity-100"}`}
                  style={{ borderColor: newKind === "funnel" ? ST.green : "#e4eae6", background: newKind === "funnel" ? ST.greenSoft : "#fff" }}>
                  <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>🛒 Tunnel de vente</p>
                  <p className="text-[11px] font-semibold mt-1 leading-snug" style={{ color: ST.textSecondary }}>4 étapes : Landing → Checkout → Upsell → Merci. Pour vendre un produit.</p>
                </button>
                <button type="button" onClick={() => setNewKind("capture")}
                  className={`text-left rounded-[14px] p-3.5 border-2 transition-all ${newKind === "capture" ? "shadow-md" : "opacity-70 hover:opacity-100"}`}
                  style={{ borderColor: newKind === "capture" ? "#7c3aed" : "#e4eae6", background: newKind === "capture" ? "#f5f3ff" : "#fff" }}>
                  <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>📧 Page de capture</p>
                  <p className="text-[11px] font-semibold mt-1 leading-snug" style={{ color: ST.textSecondary }}>Une seule page avec formulaire — collectez des emails contre un cadeau.</p>
                </button>
              </div>

              {error && (
                <div className="rounded-[12px] px-4 py-3 mb-4 flex items-center gap-2" style={{ background: ST.roseSoft, border: "1px solid #f4d4de" }}>
                  <AlertCircle size={18} style={{ color: ST.roseText }} />
                  <p className="text-[13px] font-semibold" style={{ color: ST.roseText }}>{error}</p>
                </div>
              )}

              <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Nom du funnel</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: Lancement formation marketing 2026"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                style={{ color: ST.text, border: "1px solid #dde6e0" }}
              />

              <div className="rounded-[12px] p-3 mt-4 mb-5 flex items-start gap-2" style={{ background: ST.greenSoft, border: "1px solid #d7ecde" }}>
                <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: ST.green }} />
                <p className="text-[12px] font-semibold" style={{ color: "#2f7a4c" }}>
                  {newKind === "capture" ? (
                    <>Votre page de capture sera créée avec un <strong>formulaire email prêt à l&apos;emploi</strong>. Les leads collectés apparaissent dans l&apos;éditeur (bouton « Leads », export CSV).</>
                  ) : (
                    <>Votre funnel sera créé avec 4 étapes par défaut : <strong>Landing → Checkout → Upsell → Merci</strong>. Vous pourrez tout personnaliser.</>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <StButton variant="secondary" className="flex-1" onClick={() => setShowCreate(false)} disabled={creating}>
                  Annuler
                </StButton>
                <StButton
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  icon={creating ? Loader2 : PlusCircle}
                >
                  {creating ? "Création…" : "Créer"}
                </StButton>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
