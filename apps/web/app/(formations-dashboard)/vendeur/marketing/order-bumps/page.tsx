"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type OrderBump = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  bumpFormationId: string | null;
  bumpProductId: string | null;
  appliesToAll: boolean;
  targetFormationIds: string[];
  targetProductIds: string[];
  viewsCount: number;
  acceptedCount: number;
  isActive: boolean;
  createdAt: string;
  bumpFormation: { id: string; title: string; slug: string; thumbnail: string | null } | null;
  bumpProduct: { id: string; title: string; slug: string; banner: string | null } | null;
};

type VendorProducts = {
  formations: Array<{ id: string; title: string; thumbnail: string | null }>;
  digitalProducts: Array<{ id: string; title: string; thumbnail: string | null }>;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function OrderBumpsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(2900);
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [bumpType, setBumpType] = useState<"formation" | "product">("formation");
  const [bumpFormationId, setBumpFormationId] = useState("");
  const [bumpProductId, setBumpProductId] = useState("");
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [targetFormationIds, setTargetFormationIds] = useState<string[]>([]);
  const [targetProductIds, setTargetProductIds] = useState<string[]>([]);

  const { data: bumpsResp, isLoading } = useQuery<{ data: OrderBump[] }>({
    queryKey: ["vendeur-order-bumps"],
    queryFn: () => fetch("/api/formations/vendeur/order-bumps").then((r) => r.json()),
    staleTime: 15_000,
  });
  const bumps = bumpsResp?.data ?? [];

  const { data: productsResp } = useQuery<{ data: VendorProducts }>({
    queryKey: ["vendeur-formations-light"],
    queryFn: async () => {
      const res = await fetch("/api/formations/vendeur/formations");
      const j = await res.json();
      const data = j.data ?? j;
      return {
        data: {
          formations: (data.formations ?? []).map((f: { id: string; title: string; thumbnail: string | null }) => ({
            id: f.id, title: f.title, thumbnail: f.thumbnail,
          })),
          digitalProducts: (data.digitalProducts ?? []).map((p: { id: string; title: string; thumbnail: string | null }) => ({
            id: p.id, title: p.title, thumbnail: p.thumbnail,
          })),
        },
      };
    },
    staleTime: 60_000,
  });
  const availableFormations = productsResp?.data?.formations ?? [];
  const availableProducts = productsResp?.data?.digitalProducts ?? [];

  const createMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title, description, price: Number(price),
        appliesToAll,
      };
      if (originalPrice !== "") payload.originalPrice = Number(originalPrice);
      if (bumpType === "formation") payload.bumpFormationId = bumpFormationId;
      else payload.bumpProductId = bumpProductId;
      if (!appliesToAll) {
        payload.targetFormationIds = targetFormationIds;
        payload.targetProductIds = targetProductIds;
      }
      const res = await fetch("/api/formations/vendeur/order-bumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Order bump créé ✓");
      qc.invalidateQueries({ queryKey: ["vendeur-order-bumps"] });
      setShowCreate(false);
      // Reset form
      setTitle(""); setDescription(""); setPrice(2900); setOriginalPrice("");
      setBumpFormationId(""); setBumpProductId("");
      setAppliesToAll(true); setTargetFormationIds([]); setTargetProductIds([]);
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const toggleMut = useMutation({
    mutationFn: async (args: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/formations/vendeur/order-bumps/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: args.isActive }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-order-bumps"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/vendeur/order-bumps/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Order bump supprimé");
      qc.invalidateQueries({ queryKey: ["vendeur-order-bumps"] });
      setTimeout(() => setToast(null), 3000);
    },
  });

  async function handleDelete(bump: OrderBump) {
    const ok = await confirmAction({
      title: "Supprimer cet order bump ?",
      message: `"${bump.title}" ne sera plus proposé au checkout.`,
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (ok) deleteMut.mutate(bump.id);
  }

  const conversionRate = (b: OrderBump) =>
    b.viewsCount > 0 ? ((b.acceptedCount / b.viewsCount) * 100).toFixed(1) : "0";

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <Link href="/vendeur/marketing" className="text-xs font-semibold text-[#5c647a] hover:text-[#191c1e] inline-flex items-center gap-1 mb-6">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Marketing
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Order Bumps</h1>
          <p className="text-sm text-[#5c647a] mt-1 max-w-2xl">
            Proposez un produit complémentaire via checkbox au moment du paiement.
            Les acheteurs cochent et ajoutent au panier en un clic — +20 à 30% de panier moyen en moyenne.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau Order Bump
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : bumps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">add_shopping_cart</span>
          <h3 className="text-lg font-bold text-[#191c1e] mt-3">Aucun order bump encore</h3>
          <p className="text-sm text-[#5c647a] mt-2 max-w-md mx-auto">
            Créez votre premier bump pour booster vos paniers. Exemple : une formation principale
            à 25 000 F + un bump « Pack ressources +2 900 F ».
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Créer mon premier bump
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bumps.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {b.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt={b.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white flex-shrink-0">
                      <span className="material-symbols-outlined">add_shopping_cart</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-[#191c1e] truncate">{b.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? "bg-[#006e2f]" : "bg-gray-300"}`} />
                        {b.isActive ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <p className="text-xs text-[#5c647a] mt-1 line-clamp-2">{b.description}</p>
                    <p className="text-[11px] text-[#5c647a] mt-1">
                      Produit offert :{" "}
                      <strong className="text-[#191c1e]">
                        {b.bumpFormation?.title ?? b.bumpProduct?.title ?? "—"}
                      </strong>
                      {b.appliesToAll && <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">S'affiche partout</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 lg:gap-8">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-[#006e2f] tabular-nums">{formatFCFA(b.price)}</p>
                    <p className="text-[10px] text-[#5c647a] uppercase tracking-widest">FCFA</p>
                    {b.originalPrice && b.originalPrice > b.price && (
                      <p className="text-[10px] text-[#5c647a] line-through tabular-nums">{formatFCFA(b.originalPrice)}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#191c1e] tabular-nums">{b.viewsCount}</p>
                    <p className="text-[10px] text-[#5c647a]">vues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-blue-600 tabular-nums">{b.acceptedCount}</p>
                    <p className="text-[10px] text-[#5c647a]">acceptés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-purple-600 tabular-nums">{conversionRate(b)}%</p>
                    <p className="text-[10px] text-[#5c647a]">conv.</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleMut.mutate({ id: b.id, isActive: !b.isActive })}
                      disabled={toggleMut.isPending}
                      className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a] hover:text-[#191c1e]"
                      title={b.isActive ? "Désactiver" : "Activer"}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {b.isActive ? "toggle_on" : "toggle_off"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      disabled={deleteMut.isPending}
                      className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !createMut.isPending && setShowCreate(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Nouveau Order Bump</h2>
            <p className="text-sm text-[#5c647a] mb-5">
              Ce bump apparaîtra sur la page checkout des produits ciblés, avant le paiement.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1.5">Titre du bump</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pack ressources bonus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1.5">Description (pitch court)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ex: 50 templates Excel + checklists prêtes à l'emploi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#191c1e] mb-1.5">Prix bump (FCFA)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                    Prix normal <span className="font-normal text-[#5c647a]">(optionnel, barré)</span>
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ex: 9900"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1.5">Produit à ajouter au panier</label>
                <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden mb-2">
                  <button
                    type="button"
                    onClick={() => setBumpType("formation")}
                    className={`flex-1 py-2 text-xs font-bold ${bumpType === "formation" ? "bg-[#006e2f] text-white" : "bg-white text-[#5c647a]"}`}
                  >
                    Formation
                  </button>
                  <button
                    type="button"
                    onClick={() => setBumpType("product")}
                    className={`flex-1 py-2 text-xs font-bold ${bumpType === "product" ? "bg-[#006e2f] text-white" : "bg-white text-[#5c647a]"}`}
                  >
                    Produit digital
                  </button>
                </div>
                {bumpType === "formation" ? (
                  <select
                    value={bumpFormationId}
                    onChange={(e) => setBumpFormationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  >
                    <option value="">Choisir une formation…</option>
                    {availableFormations.map((f) => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={bumpProductId}
                    onChange={(e) => setBumpProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  >
                    <option value="">Choisir un produit…</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appliesToAll}
                    onChange={(e) => setAppliesToAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#191c1e]">
                    Afficher ce bump au checkout de <strong>tous mes produits</strong>
                  </span>
                </label>
                {!appliesToAll && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                    Avec ciblage précis (non coché), le bump n'apparaîtra que sur les produits que vous
                    sélectionnerez. Pour le MVP, on active « tous les produits » par défaut — vous pourrez
                    affiner plus tard via l'API.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  disabled={createMut.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => createMut.mutate()}
                  disabled={
                    createMut.isPending ||
                    !title || !description || !price ||
                    (bumpType === "formation" && !bumpFormationId) ||
                    (bumpType === "product" && !bumpProductId)
                  }
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  {createMut.isPending ? "Création…" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
