"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2,
  Plus,
  Copy,
  Check,
  Code2,
  Trash2,
  Pause,
  Play,
  Loader2,
  X,
  Wallet,
  Sparkles,
} from "lucide-react";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { useToastStore } from "@/store/toast";

interface PayLink {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  allowCustomAmount: boolean;
  status: string;
  salesCount: number;
  currentBuyers: number;
  revenue: number;
  url: string;
  redirectUrl?: string | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export default function LiensPaiementPage() {
  const toast = useToastStore.getState().addToast;
  const [links, setLinks] = useState<PayLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [priceMode, setPriceMode] = useState<"fixed" | "libre">("fixed");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showIntegration, setShowIntegration] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [embedFor, setEmbedFor] = useState<PayLink | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://novakou.com";
  const fullUrl = (l: PayLink) => `${origin}${l.url}`;

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/formations/vendeur/liens-paiement");
      const json = await res.json();
      if (res.ok) setLinks(json.data ?? []);
    } catch {
      toast("error", "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (title.trim().length < 2) { toast("error", "Titre trop court."); return; }
    if (priceMode === "fixed" && (!Number.isFinite(amt) || amt <= 0)) {
      toast("error", "Montant invalide.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/formations/vendeur/liens-paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number.isFinite(amt) ? amt : 0,
          description: description.trim() || undefined,
          image: image || undefined,
          priceMode,
          redirectUrl: redirectUrl.trim() || undefined,
          webhookUrl: webhookUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast("error", json.error ?? "Erreur"); return; }
      toast("success", "Lien de paiement créé 🎉");
      setTitle(""); setAmount(""); setDescription(""); setImage(""); setPriceMode("fixed");
      setRedirectUrl(""); setWebhookUrl(""); setShowIntegration(false); setShowForm(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(l: PayLink) {
    try {
      await navigator.clipboard.writeText(fullUrl(l));
      setCopiedId(l.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast("error", "Copie impossible");
    }
  }

  async function toggleStatus(l: PayLink) {
    setBusyId(l.id);
    const next = l.status === "ACTIF" ? "ARCHIVE" : "ACTIF";
    try {
      const res = await fetch(`/api/formations/vendeur/products/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); toast("error", j.error ?? "Erreur"); return; }
      toast("success", next === "ACTIF" ? "Lien réactivé" : "Lien mis en pause");
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(l: PayLink) {
    if (!confirm(`Supprimer le lien « ${l.title} » ? Cette action est définitive.`)) return;
    setBusyId(l.id);
    try {
      const res = await fetch(`/api/formations/vendeur/products/${l.id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json().catch(() => ({})); toast("error", j.error ?? "Erreur"); return; }
      toast("success", "Lien supprimé");
      load();
    } finally {
      setBusyId(null);
    }
  }

  const embedCode = (l: PayLink) =>
    `<a href="${fullUrl(l)}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(to right,#006e2f,#22c55e);color:#fff;font-weight:700;font-family:sans-serif;padding:12px 22px;border-radius:12px;text-decoration:none">Payer ${fmt(l.price)} FCFA</a>`;

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] flex items-center gap-2">
              <Link2 className="text-[#006e2f]" size={24} />
              Liens de paiement
            </h1>
            <p className="text-sm text-[#5c647a] mt-1">
              Encaissez n&apos;importe quel montant. Partagez le lien ou intégrez-le sur votre site.
              Commission 10 %, compté comme une vente.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Fermer" : "Créer un lien"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Titre / objet du paiement</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
                placeholder="Ex. Acompte prestation, Don, Consultation…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              />
            </div>

            {/* Type de montant : fixe ou libre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Montant</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {([["fixed", "Montant fixe"], ["libre", "Prix libre"]] as const).map(([k, lbl]) => (
                  <button
                    key={k} type="button" onClick={() => setPriceMode(k)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      priceMode === k ? "border-[#006e2f] bg-[#006e2f]/5 text-[#006e2f]" : "border-gray-200 text-[#5c647a] hover:bg-gray-50"
                    }`}
                  >
                    {k === "libre" && <Sparkles size={13} className="inline mr-1 -mt-0.5" />}
                    {lbl}
                  </button>
                ))}
              </div>
              <input
                type="number" min={priceMode === "fixed" ? 1 : 0} value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={priceMode === "libre" ? "Montant suggéré (optionnel)" : "5000"}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {priceMode === "libre"
                  ? "L'acheteur choisira lui-même le montant (min. 100 FCFA). Le montant ci-dessus est juste une suggestion."
                  : "Le client paiera exactement ce montant en FCFA."}
              </p>
            </div>

            {/* Image (optionnelle) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Image (optionnelle)</label>
              <div className="max-w-[220px]">
                <ImageUploader
                  value={image}
                  onChange={(url) => setImage(url || "")}
                  folder="portfolio"
                  aspectClass="aspect-[16/9]"
                  helper="JPG ou PNG · affichée sur la page de paiement"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Description (optionnelle)</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={2000}
                placeholder="Précisez ce que le client paie…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              />
            </div>
            {/* Intégration sur le site du vendeur (optionnel) */}
            <div className="rounded-xl border border-gray-100 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setShowIntegration((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-[#5c647a]">
                  Intégration sur mon site (optionnel)
                </span>
                <span className={`text-[#006e2f] text-lg leading-none transition-transform ${showIntegration ? "rotate-45" : ""}`}>+</span>
              </button>
              {showIntegration && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pour intégrer ce lien sur votre propre site : après le paiement, l&apos;acheteur peut être
                    renvoyé chez vous, et votre serveur peut être notifié pour débloquer l&apos;accès.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5c647a] mb-1">URL de redirection après paiement</label>
                    <input
                      type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://mon-site.com/merci"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">L&apos;acheteur y est renvoyé avec <code className="text-slate-500">?ref=…&amp;status=success</code>.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5c647a] mb-1">URL de webhook (notification serveur, https)</label>
                    <input
                      type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://mon-site.com/api/novakou-webhook"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      À chaque vente, Novakou envoie un POST JSON signé (header <code className="text-slate-500">X-Novakou-Signature</code>,
                      HMAC-SHA256). Un secret de vérification est généré et affiché sur le lien créé.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit" disabled={creating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {creating ? "Création…" : "Créer le lien"}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : links.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center mx-auto mb-4">
              <Link2 size={26} />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">Aucun lien de paiement</h3>
            <p className="text-sm text-[#5c647a] mt-1.5 mb-5 max-w-md mx-auto">
              Créez votre premier lien pour encaisser un montant fixe et le partager partout.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <Plus size={16} /> Créer un lien
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((l) => {
              const paused = l.status !== "ACTIF";
              return (
                <div key={l.id} className={`bg-white rounded-2xl border border-gray-100 p-4 md:p-5 ${paused ? "opacity-70" : ""}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.thumbnail && (
                      <img src={l.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-[#111827] text-sm truncate">{l.title}</h3>
                        {l.allowCustomAmount && <span className="text-[10px] font-bold uppercase tracking-wide text-[#006e2f] bg-[#006e2f]/10 px-2 py-0.5 rounded-full">Prix libre</span>}
                        {paused && <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">En pause</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-[#5c647a] flex-wrap">
                        <span className="font-bold text-[#006e2f]">{l.allowCustomAmount ? "Montant libre" : `${fmt(l.price)} FCFA`}</span>
                        <span className="inline-flex items-center gap-1"><Wallet size={13} /> {l.salesCount} vente{l.salesCount > 1 ? "s" : ""}</span>
                        {l.revenue > 0 && <span>· {fmt(l.revenue)} FCFA encaissés</span>}
                      </div>
                      <code className="inline-block mt-2 text-[11px] text-[#5c647a] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 truncate max-w-full">
                        {fullUrl(l)}
                      </code>
                      {(l.redirectUrl || l.webhookUrl) && (
                        <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                          {l.redirectUrl && (
                            <div className="truncate">Redirection : <span className="text-slate-600">{l.redirectUrl}</span></div>
                          )}
                          {l.webhookUrl && (
                            <div className="truncate">Webhook : <span className="text-slate-600">{l.webhookUrl}</span></div>
                          )}
                          {l.webhookSecret && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>Secret de signature :</span>
                              <code className="bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 truncate max-w-[180px]">{l.webhookSecret}</code>
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(l.webhookSecret ?? ""); toast("success", "Secret copié"); }}
                                className="text-[#006e2f] font-semibold hover:underline"
                              >
                                Copier
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => copyLink(l)} title="Copier le lien" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#006e2f]/10 text-[#006e2f] text-xs font-bold hover:bg-[#006e2f]/15 transition-colors">
                        {copiedId === l.id ? <Check size={15} /> : <Copy size={15} />}
                        <span className="hidden sm:inline">{copiedId === l.id ? "Copié" : "Copier"}</span>
                      </button>
                      <button onClick={() => setEmbedFor(l)} title="Code d'intégration" className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                        <Code2 size={15} />
                      </button>
                      <button onClick={() => toggleStatus(l)} disabled={busyId === l.id} title={paused ? "Réactiver" : "Mettre en pause"} className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50">
                        {busyId === l.id ? <Loader2 size={15} className="animate-spin" /> : paused ? <Play size={15} /> : <Pause size={15} />}
                      </button>
                      <button onClick={() => remove(l)} disabled={busyId === l.id} title="Supprimer" className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embed modal */}
      {embedFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEmbedFor(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-[#111827] flex items-center gap-2"><Code2 size={18} /> Intégrer le bouton</h3>
              <button onClick={() => setEmbedFor(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <p className="text-sm text-[#5c647a] mb-3">Collez ce code sur votre site ou application pour afficher un bouton de paiement.</p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-slate-50 p-4 flex justify-center border-b border-gray-100" dangerouslySetInnerHTML={{ __html: embedCode(embedFor) }} />
              <pre className="bg-[#0d1117] text-[#e6edf3] text-[11px] p-4 overflow-x-auto whitespace-pre-wrap break-all">{embedCode(embedFor)}</pre>
            </div>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(embedCode(embedFor)); toast("success", "Code copié"); } catch { toast("error", "Copie impossible"); } }}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <Copy size={16} /> Copier le code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
