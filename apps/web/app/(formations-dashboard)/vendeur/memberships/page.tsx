"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, BadgePercent, ExternalLink, Pencil, Pause, Play, Trash2 } from "lucide-react";
import { confirmAction } from "@/store/confirm";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { RichTextEditor } from "@/components/formations/RichTextEditor";

type Plan = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  linkedFormationIds: string[];
  linkedProductIds: string[];
  trialDays: number | null;
  maxMembers: number | null;
  activeCount: number;
  totalEarned: number;
  isActive: boolean;
  createdAt: string;
  _count?: { subscriptions: number };
};

type VendorProducts = {
  formations: Array<{ id: string; title: string }>;
  digitalProducts: Array<{ id: string; title: string }>;
};

type Subscriber = {
  id: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  totalPaid: number;
  buyerName: string;
  buyerEmail: string;
  planName: string;
  interval: string;
};

const SUB_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  trialing: { label: "Essai", cls: "bg-blue-50 text-blue-700" },
  active: { label: "Actif", cls: "bg-emerald-50 text-emerald-700" },
  past_due: { label: "Impayé", cls: "bg-amber-50 text-amber-700" },
  cancelled: { label: "Résilié", cls: "bg-gray-100 text-gray-500" },
  expired: { label: "Expiré", cls: "bg-gray-100 text-gray-500" },
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function MembershipsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form. `editingId === null` ⇒ création ; sinon ⇒ édition d'un plan existant.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(5000);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedFormationIds, setSelectedFormationIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [trialDays, setTrialDays] = useState<number | "">("");
  const [maxMembers, setMaxMembers] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  function resetForm() {
    setEditingId(null);
    setName(""); setDescription(""); setPrice(5000); setInterval("monthly");
    setSelectedFormationIds([]); setSelectedProductIds([]);
    setTrialDays(""); setMaxMembers("");
    setImageUrl(""); setBannerUrl("");
  }

  function openEdit(p: Plan) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    setInterval(p.interval);
    setSelectedFormationIds(p.linkedFormationIds ?? []);
    setSelectedProductIds(p.linkedProductIds ?? []);
    setTrialDays(p.trialDays ?? "");
    setMaxMembers(p.maxMembers ?? "");
    setImageUrl(p.imageUrl ?? "");
    setBannerUrl(p.bannerUrl ?? "");
    setShowCreate(true);
  }

  const { data: plansResp, isLoading } = useQuery<{ data: Plan[] }>({
    queryKey: ["vendeur-subscription-plans"],
    queryFn: () => fetch("/api/formations/vendeur/subscription-plans").then((r) => r.json()),
    staleTime: 30_000,
  });
  const plans = plansResp?.data ?? [];

  // ── Abonnés (liste + résiliation) ────────────────────────────────────────
  const { data: subsResp, isLoading: subsLoading } = useQuery<{ data: Subscriber[] }>({
    queryKey: ["vendeur-subscribers"],
    queryFn: () => fetch("/api/formations/vendeur/subscribers").then((r) => r.json()),
    staleTime: 30_000,
  });
  const subscribers = subsResp?.data ?? [];

  const cancelSubMut = useMutation({
    mutationFn: async (sub: Subscriber) => {
      const res = await fetch(`/api/formations/vendeur/subscribers/${sub.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atPeriodEnd: false }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Abonné résilié — accès coupé.");
      qc.invalidateQueries({ queryKey: ["vendeur-subscribers"] });
      qc.invalidateQueries({ queryKey: ["vendeur-subscription-plans"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleCancelSub(sub: Subscriber) {
    const ok = await confirmAction({
      title: `Résilier l'abonnement de ${sub.buyerName} ?`,
      message: "L'accès aux contenus du plan sera coupé immédiatement. L'abonné reste dans votre historique. Cette action est définitive.",
      confirmLabel: "Résilier",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (ok) cancelSubMut.mutate(sub);
  }

  const { data: productsResp } = useQuery<{ data: VendorProducts }>({
    queryKey: ["vendeur-formations-light"],
    queryFn: async () => {
      const res = await fetch("/api/formations/vendeur/formations");
      const j = await res.json();
      const data = j.data ?? j;
      return {
        data: {
          formations: (data.formations ?? []).map((f: { id: string; title: string }) => ({ id: f.id, title: f.title })),
          digitalProducts: (data.digitalProducts ?? []).map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })),
        },
      };
    },
    staleTime: 60_000,
  });
  const availableFormations = productsResp?.data?.formations ?? [];
  const availableProducts = productsResp?.data?.digitalProducts ?? [];

  // Create OR Edit selon `editingId`. La même mutation gère les 2 cas pour
  // garder le code simple — on choisit verbe HTTP + URL au moment du fetch.
  const createMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name, description, price: Number(price), interval,
        linkedFormationIds: selectedFormationIds,
        linkedProductIds: selectedProductIds,
        imageUrl: imageUrl || null,
        bannerUrl: bannerUrl || null,
      };
      if (trialDays !== "") payload.trialDays = Number(trialDays);
      if (maxMembers !== "") payload.maxMembers = Number(maxMembers);
      const url = editingId
        ? `/api/formations/vendeur/subscription-plans/${editingId}`
        : "/api/formations/vendeur/subscription-plans";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast(editingId ? "Plan mis à jour ✓" : "Plan d'abonnement créé ✓");
      qc.invalidateQueries({ queryKey: ["vendeur-subscription-plans"] });
      setShowCreate(false);
      resetForm();
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const toggleMut = useMutation({
    mutationFn: async (args: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/formations/vendeur/subscription-plans/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: args.isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-subscription-plans"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/vendeur/subscription-plans/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: (data) => {
      setToast(data?.data?.deactivated ? "Plan désactivé (abonnés actifs)" : "Plan supprimé");
      qc.invalidateQueries({ queryKey: ["vendeur-subscription-plans"] });
      setTimeout(() => setToast(null), 3000);
    },
  });

  async function handleDelete(p: Plan) {
    const msg = p.activeCount > 0
      ? `Le plan a ${p.activeCount} abonnés actifs — il sera désactivé plutôt que supprimé.`
      : "Cette action est irréversible.";
    const ok = await confirmAction({
      title: `Supprimer le plan "${p.name}" ?`,
      message: msg,
      confirmLabel: p.activeCount > 0 ? "Désactiver" : "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (ok) deleteMut.mutate(p.id);
  }

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#13241b]">Abonnements / Memberships</h1>
          <p className="text-sm text-[#5c647a] mt-1 max-w-2xl">
            Créez des plans d'accès récurrent à vos formations. Les abonnés payent chaque mois (ou année)
            et gardent l'accès tant qu'ils sont à jour. MRR garanti, rétention maximale.
          </p>
        </div>
        <button
          onClick={() => {
            if (showCreate) { resetForm(); }
            setShowCreate((v) => !v);
            if (!showCreate && typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          {showCreate ? <X size={18} /> : <Plus size={18} />}
          {showCreate ? "Fermer" : "Nouveau plan"}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BadgePercent size={48} className="text-gray-300 mx-auto" strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-[#13241b] mt-3">Aucun plan d'abonnement</h3>
          <p className="text-sm text-[#5c647a] mt-2 max-w-md mx-auto">
            Créez votre premier plan pour commencer à générer du revenu récurrent (MRR).
            Exemple : « Membre Elite — 15 000 F/mois — accès à toutes mes formations ».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-extrabold text-[#13241b]">{p.name}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a]"}`}>
                      {p.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <p className="text-xs text-[#5c647a] line-clamp-2">{p.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Link
                    href={`/abonnement/${p.id}`}
                    target="_blank"
                    className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                    title="Voir la page publique"
                  >
                    <ExternalLink size={18} />
                  </Link>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-[#5c647a] hover:text-blue-600"
                    title="Modifier"
                  >
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => toggleMut.mutate({ id: p.id, isActive: !p.isActive })}
                    className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a]" title={p.isActive ? "Mettre en pause" : "Réactiver"}>
                    {p.isActive ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button onClick={() => handleDelete(p)}
                    className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-3xl font-extrabold text-[#006e2f]">{formatFCFA(p.price)}</p>
                <span className="text-xs text-[#5c647a]">F CFA / {p.interval === "yearly" ? "an" : "mois"}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-[#5c647a] uppercase">Abonnés</p>
                  <p className="text-base font-bold text-[#13241b]">{p._count?.subscriptions ?? p.activeCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#5c647a] uppercase">Revenus</p>
                  <p className="text-base font-bold text-[#006e2f]">{formatFCFA(p.totalEarned)} F</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#5c647a] uppercase">Contenu</p>
                  <p className="text-base font-bold text-[#13241b]">{p.linkedFormationIds.length + p.linkedProductIds.length}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form INLINE — affiché au-dessus de la liste, scroll naturel sur la
          page (plus de modal popup tronqué). Mêmes principes que bundles. */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <h2 className="text-base font-extrabold text-[#13241b]">
            {editingId ? "Modifier le plan d'abonnement" : "Nouveau plan d'abonnement"}
          </h2>
          <p className="text-sm text-[#5c647a]">
            Les abonnés paient la première période au moment de s'inscrire, puis un email de renouvellement
            leur est envoyé à l'échéance pour recharger automatiquement.
          </p>

          <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#13241b] mb-1.5">Nom du plan</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Membre Elite, Mentorat Mensuel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#13241b] mb-1.5">Vignette (carte marketplace)</label>
                  <ImageUploader
                    value={imageUrl}
                    onChange={setImageUrl}
                    aspectClass="aspect-square"
                    helper="600×600 carré · JPG/PNG · Max 5 MB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#13241b] mb-1.5">Bannière de couverture</label>
                  <ImageUploader
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    aspectClass="aspect-video"
                    helper="1280×720 (16:9) · JPG/PNG · Max 5 MB"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13241b] mb-1.5">
                  Description (pitch valeur)
                  <span className="ml-2 font-normal text-[#5c647a]">(le bouton ✨ IA améliore le texte)</span>
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Ex: Accès illimité à toutes mes formations + session live hebdomadaire"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#13241b] mb-1.5">Prix</label>
                  <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                    min={500} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#13241b] mb-1.5">Intervalle</label>
                  <select value={interval} onChange={(e) => setInterval(e.target.value as "monthly" | "yearly")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm">
                    <option value="monthly">Mensuel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#13241b] mb-1.5">
                    Jours d'essai <span className="font-normal text-[#5c647a]">(optionnel)</span>
                  </label>
                  <input type="number" value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value === "" ? "" : Number(e.target.value))}
                    min={0} max={30} placeholder="Ex: 7"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#13241b] mb-1.5">
                    Max membres <span className="font-normal text-[#5c647a]">(optionnel)</span>
                  </label>
                  <input type="number" value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value === "" ? "" : Number(e.target.value))}
                    min={1} placeholder="Illimité"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13241b] mb-2">
                  Formations incluses ({selectedFormationIds.length} sélectionnées)
                </label>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {availableFormations.length === 0 ? (
                    <p className="text-xs text-[#5c647a] p-2">Aucune formation. Créez-en une d'abord.</p>
                  ) : availableFormations.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedFormationIds.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedFormationIds((p) => [...p, f.id]);
                          else setSelectedFormationIds((p) => p.filter((id) => id !== f.id));
                        }}
                        className="w-4 h-4 accent-[#006e2f]" />
                      <span className="text-sm text-[#13241b]">{f.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#13241b] mb-2">
                  Produits digitaux inclus ({selectedProductIds.length} sélectionnés)
                </label>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {availableProducts.length === 0 ? (
                    <p className="text-xs text-[#5c647a] p-2">Aucun produit digital.</p>
                  ) : availableProducts.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProductIds((prev) => [...prev, p.id]);
                          else setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                        }}
                        className="w-4 h-4 accent-[#006e2f]" />
                      <span className="text-sm text-[#13241b]">{p.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => createMut.mutate()}
                  disabled={createMut.isPending || !name || !description || !price ||
                    (selectedFormationIds.length === 0 && selectedProductIds.length === 0)}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                  {createMut.isPending
                    ? (editingId ? "Mise à jour…" : "Création…")
                    : (editingId ? "Mettre à jour" : "Créer le plan")}
                </button>
                <button onClick={() => { setShowCreate(false); resetForm(); }} disabled={createMut.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-[#13241b] text-sm font-bold">
                  Annuler
                </button>
              </div>
            </div>
        </div>
      )}

      {/* ── Mes abonnés ─────────────────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="text-base font-extrabold text-[#13241b] mb-1">Mes abonnés</h2>
        <p className="text-sm text-[#5c647a] mb-4">
          Les personnes abonnées à vos plans. Résilier coupe l&apos;accès immédiatement ; l&apos;abonné reste dans l&apos;historique.
        </p>

        {subsLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-[#5c647a]">
            Aucun abonné pour le moment.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {subscribers.map((s) => {
              const st = SUB_STATUS_LABEL[s.status] ?? { label: s.status, cls: "bg-gray-100 text-gray-500" };
              const resilie = s.status === "cancelled" || s.status === "expired";
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#13241b] text-sm truncate">{s.buyerName}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      {s.cancelAtPeriodEnd && !resilie && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Fin de période</span>
                      )}
                    </div>
                    <div className="text-[12px] text-[#5c647a] mt-0.5 truncate">
                      {s.buyerEmail && <span>{s.buyerEmail} · </span>}
                      <span className="font-semibold">{s.planName}</span>
                      {" · "}{formatFCFA(s.totalPaid)} FCFA cumulés
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Depuis le {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      {!resilie && s.currentPeriodEnd && <> · échéance {new Date(s.currentPeriodEnd).toLocaleDateString("fr-FR")}</>}
                    </div>
                  </div>
                  {!resilie && (
                    <button
                      onClick={() => handleCancelSub(s)}
                      disabled={cancelSubMut.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 disabled:opacity-50 flex-shrink-0"
                    >
                      <Trash2 size={14} /> Résilier
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
