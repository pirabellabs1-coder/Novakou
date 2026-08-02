"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import { ArrowLeft, Plus, ShoppingCart, ToggleRight, ToggleLeft, Trash2, Pencil } from "lucide-react";

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
  // null = création ; sinon on édite le bump portant cet id.
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function resetForm() {
    setTitle(""); setDescription(""); setPrice(2900); setOriginalPrice("");
    setBumpType("formation"); setBumpFormationId(""); setBumpProductId("");
    setAppliesToAll(true); setTargetFormationIds([]); setTargetProductIds([]);
  }

  function openCreate() {
    resetForm();
    setEditingId(null);
    setShowCreate(true);
  }

  /** Ouvre le formulaire pré-rempli pour modifier un bump existant. */
  function openEdit(b: OrderBump) {
    setTitle(b.title);
    setDescription(b.description);
    setPrice(b.price);
    setOriginalPrice(b.originalPrice ?? "");
    setBumpType(b.bumpFormationId ? "formation" : "product");
    setBumpFormationId(b.bumpFormationId ?? "");
    setBumpProductId(b.bumpProductId ?? "");
    setAppliesToAll(b.appliesToAll);
    setTargetFormationIds(b.targetFormationIds ?? []);
    setTargetProductIds(b.targetProductIds ?? []);
    setEditingId(b.id);
    setShowCreate(true);
  }

  // Création (POST) ou modification (PATCH) selon `editingId`.
  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title, description, price: Number(price),
        appliesToAll,
        // Toujours envoyer le ciblage : si appliesToAll repasse à false, les
        // listes doivent être à jour côté serveur (sinon bump invisible).
        targetFormationIds: appliesToAll ? [] : targetFormationIds,
        targetProductIds: appliesToAll ? [] : targetProductIds,
      };
      payload.originalPrice = originalPrice === "" ? null : Number(originalPrice);
      // Le produit offert n'est modifiable qu'à la création (le PATCH ne le
      // change pas) — on ne l'envoie donc que pour un nouveau bump.
      if (!editingId) {
        if (bumpType === "formation") payload.bumpFormationId = bumpFormationId;
        else payload.bumpProductId = bumpProductId;
      }
      const res = await fetch(
        editingId ? `/api/formations/vendeur/order-bumps/${editingId}` : "/api/formations/vendeur/order-bumps",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast(editingId ? "Order bump modifié" : "Order bump créé");
      qc.invalidateQueries({ queryKey: ["vendeur-order-bumps"] });
      setShowCreate(false);
      setEditingId(null);
      resetForm();
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
        <ArrowLeft className="w-4 h-4" />
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
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <Plus className="w-[18px] h-[18px]" />
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
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#191c1e] mt-3">Aucun order bump encore</h3>
          <p className="text-sm text-[#5c647a] mt-2 max-w-md mx-auto">
            Créez votre premier bump pour booster vos paniers. Exemple : une formation principale
            à 25 000 F + un bump « Pack ressources +2 900 F ».
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <Plus className="w-4 h-4" />
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
                      <ShoppingCart className="w-6 h-6" />
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
                      onClick={() => openEdit(b)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a] hover:text-[#006e2f]"
                      title="Modifier"
                    >
                      <Pencil className="w-[18px] h-[18px]" />
                    </button>
                    <button
                      onClick={() => toggleMut.mutate({ id: b.id, isActive: !b.isActive })}
                      disabled={toggleMut.isPending}
                      className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a] hover:text-[#191c1e]"
                      title={b.isActive ? "Désactiver" : "Activer"}
                    >
                      {b.isActive ? <ToggleRight className="w-[18px] h-[18px]" /> : <ToggleLeft className="w-[18px] h-[18px]" />}
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      disabled={deleteMut.isPending}
                      className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 className="w-[18px] h-[18px]" />
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
          onClick={() => !saveMut.isPending && setShowCreate(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">
              {editingId ? "Modifier l'Order Bump" : "Nouveau Order Bump"}
            </h2>
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

              <div className={editingId ? "opacity-60 pointer-events-none" : ""}>
                <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                  Produit à ajouter au panier
                  {editingId && <span className="ml-2 font-normal text-[#5c647a]">(non modifiable — supprimez et recréez pour changer)</span>}
                </label>
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
                  <div className="mt-2">
                    <p className="text-[11px] text-[#5c647a] mb-2">
                      Cochez les produits sur lesquels ce bump doit apparaître au checkout.
                    </p>
                    {availableFormations.length === 0 && availableProducts.length === 0 ? (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        Vous n&apos;avez encore aucun produit publié à cibler.
                      </p>
                    ) : (
                      <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-1.5">
                        {availableFormations.map((f) => (
                          <label key={f.id} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={targetFormationIds.includes(f.id)}
                              onChange={(e) =>
                                setTargetFormationIds((prev) =>
                                  e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                                )
                              }
                            />
                            <span className="truncate text-[#191c1e]">{f.title}</span>
                            <span className="text-[10px] text-[#5c647a] flex-shrink-0">Formation</span>
                          </label>
                        ))}
                        {availableProducts.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={targetProductIds.includes(p.id)}
                              onChange={(e) =>
                                setTargetProductIds((prev) =>
                                  e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                                )
                              }
                            />
                            <span className="truncate text-[#191c1e]">{p.title}</span>
                            <span className="text-[10px] text-[#5c647a] flex-shrink-0">Produit</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {targetFormationIds.length + targetProductIds.length === 0 && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                        Aucun produit sélectionné : le bump ne s&apos;affichera nulle part. Cochez au moins
                        un produit, ou activez « tous mes produits ».
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowCreate(false); setEditingId(null); }}
                  disabled={saveMut.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={
                    saveMut.isPending ||
                    !title || !description || !price ||
                    // Le produit offert n'est requis qu'à la création.
                    (!editingId && bumpType === "formation" && !bumpFormationId) ||
                    (!editingId && bumpType === "product" && !bumpProductId)
                  }
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  {saveMut.isPending
                    ? (editingId ? "Enregistrement…" : "Création…")
                    : (editingId ? "Enregistrer" : "Créer")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
