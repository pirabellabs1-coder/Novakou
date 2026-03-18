"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Archive, Eye, Package } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  titleFr: string;
  productType: string;
  price: number;
  salesCount: number;
  status: string;
  createdAt: string;
  instructeur: { user: { name: string; email: string } };
  category: { nameFr: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ACTIF: { label: "Actif", color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" },
  EN_ATTENTE: { label: "En attente", color: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" },
  BROUILLON: { label: "Brouillon", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  ARCHIVE: { label: "Archivé", color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  REFUSE: { label: "Refusé", color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400" },
};

export default function AdminProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/formations/produits?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleApprove(id: string) {
    await fetch(`/api/admin/formations/produits/approve/${id}`, { method: "POST" });
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: "ACTIF" } : p));
  }

  async function handleReject(id: string) {
    await fetch(`/api/admin/formations/produits/reject/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: "REFUSE" } : p));
    setRejectingId(null);
    setRejectReason("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Produits numériques</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {["", "EN_ATTENTE", "ACTIF", "REFUSE", "ARCHIVE"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === s ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {s ? (STATUS_MAP[s]?.label || s) : "Tous"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 uppercase">
                <th className="text-left px-4 py-3 font-semibold">Produit</th>
                <th className="text-left px-4 py-3 font-semibold">Instructeur</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-right px-4 py-3 font-semibold">Prix</th>
                <th className="text-center px-4 py-3 font-semibold">Statut</th>
                <th className="text-center px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const status = STATUS_MAP[product.status] || STATUS_MAP.BROUILLON;
                return (
                  <tr key={product.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{product.titleFr}</p>
                      <p className="text-xs text-slate-400">{product.category?.nameFr}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{product.instructeur?.user?.name}</p>
                      <p className="text-xs text-slate-400">{product.instructeur?.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{product.productType}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">{product.price.toFixed(0)}€</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {product.status === "EN_ATTENTE" && (
                          <>
                            <button
                              onClick={() => handleApprove(product.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                              title="Approuver"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectingId(rejectingId === product.id ? null : product.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                              title="Rejeter"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <a
                          href={`/formations/produits/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                      {rejectingId === product.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Motif de rejet..."
                            className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleReject(product.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold"
                          >
                            Confirmer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
