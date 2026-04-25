"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeFetch } from "@/lib/safe-fetch";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const SCOPE_LABELS: Record<string, { label: string; color: string }> = {
  "read:products": { label: "Lire produits", color: "bg-blue-50 text-blue-700" },
  "write:products": { label: "Écrire produits", color: "bg-blue-100 text-blue-800" },
  "read:orders": { label: "Lire commandes", color: "bg-green-50 text-green-700" },
  "write:orders": { label: "Écrire commandes", color: "bg-green-100 text-green-800" },
  "read:customers": { label: "Lire clients", color: "bg-purple-50 text-purple-700" },
  "write:customers": { label: "Écrire clients", color: "bg-purple-100 text-purple-800" },
  "read:analytics": { label: "Analytics", color: "bg-orange-50 text-orange-700" },
  "admin": { label: "Admin (tout)", color: "bg-red-50 text-red-700" },
};

const ALL_SCOPES = Object.keys(SCOPE_LABELS);

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; scopes: string[]; expiresInDays: number | null }>({
    name: "",
    scopes: ["read:products", "read:orders"],
    expiresInDays: null,
  });
  const [createdKey, setCreatedKey] = useState<{ rawKey: string; name: string } | null>(null);

  const { data, isLoading } = useQuery<{ data: ApiKey[] }>({
    queryKey: ["vendeur-api-keys"],
    queryFn: async () => {
      const r = await safeFetch<{ data: ApiKey[] }>("/api/formations/vendeur/api-keys");
      return r.data ?? { data: [] };
    },
  });
  const keys = data?.data ?? [];

  const createMut = useMutation({
    mutationFn: async (payload: typeof form) => {
      const r = await safeFetch<{ data: ApiKey & { rawKey: string } }>(
        "/api/formations/vendeur/api-keys",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (r.error) throw new Error(r.error);
      return r.data!.data;
    },
    onSuccess: (key) => {
      setCreatedKey({ rawKey: key.rawKey, name: key.name });
      setShowForm(false);
      setForm({ name: "", scopes: ["read:products", "read:orders"], expiresInDays: null });
      qc.invalidateQueries({ queryKey: ["vendeur-api-keys"] });
    },
    onError: (err: Error) =>
      useToastStore.getState().addToast("error", err.message),
  });

  const revokeMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/vendeur/api-keys/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-api-keys"] });
      useToastStore.getState().addToast("success", "Clé révoquée");
    },
  });

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#5c647a] mb-2">
        <Link href="/vendeur/dashboard" className="hover:text-[#006e2f] transition-colors">
          Espace vendeur
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#191c1e] font-medium">Clés API</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Clés API Novakou</h1>
          <p className="text-sm text-[#5c647a] mt-1 max-w-xl">
            Générez des clés API pour connecter vos outils et automatisations à votre boutique Novakou.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/developer/docs"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#191c1e] hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Documentation API
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouvelle clé
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-sm text-blue-900">
        <span className="material-symbols-outlined text-[20px] mt-0.5">lightbulb</span>
        <div>
          <p className="font-semibold">Comment utiliser votre clé API ?</p>
          <p className="text-xs mt-1">
            Incluez la clé dans l&apos;en-tête <code className="bg-white px-1.5 py-0.5 rounded tabular-nums text-[11px]">Authorization: Bearer nk_live_xxx</code> de chaque requête vers <code className="bg-white px-1.5 py-0.5 rounded tabular-nums text-[11px]">https://novakou.com/api/v1/*</code>
          </p>
        </div>
      </div>

      {/* Created key display (once only) */}
      {createdKey && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[22px]">warning</span>
            <div className="flex-1">
              <p className="font-bold text-amber-900">
                Votre clé &laquo; {createdKey.name} &raquo; est prête
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Copiez-la maintenant — elle ne sera plus jamais affichée pour des raisons de sécurité.
              </p>
              <div className="mt-3 flex gap-2">
                <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs tabular-nums text-amber-900 break-all">
                  {createdKey.rawKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdKey.rawKey);
                    useToastStore.getState().addToast("success", "Clé copiée dans le presse-papiers");
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Copier
                </button>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="mt-3 text-xs font-semibold text-amber-800 hover:underline"
              >
                J&apos;ai bien copié la clé, masquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys list */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
          <div className="h-4 w-48 bg-gray-100 rounded mb-3" />
          <div className="h-3 w-64 bg-gray-100 rounded" />
        </div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px] text-gray-400">key_off</span>
          </div>
          <p className="font-semibold text-[#191c1e]">Aucune clé API générée</p>
          <p className="text-sm text-[#5c647a] mt-1">Créez votre première clé pour commencer à utiliser l&apos;API</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Créer ma première clé
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">Nom</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">Clé</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">Scopes</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">Dernière utilisation</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase tracking-wide">Expire</th>
                <th className="text-right px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const isRevoked = !!k.revokedAt;
                const isExpired = k.expiresAt && new Date(k.expiresAt) < new Date();
                return (
                  <tr key={k.id} className={`border-b border-gray-50 last:border-0 ${isRevoked || isExpired ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3">
                      <p className="font-bold text-[#191c1e]">{k.name}</p>
                      <p className="text-[11px] text-[#5c647a]">Créée le {fmtDate(k.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <code className="tabular-nums text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 text-[#191c1e]">
                        {k.keyPrefix}...
                      </code>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SCOPE_LABELS[s]?.color ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {SCOPE_LABELS[s]?.label ?? s}
                          </span>
                        ))}
                        {k.scopes.length > 3 && (
                          <span className="text-[10px] text-[#5c647a]">+{k.scopes.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#5c647a]">{fmtDate(k.lastUsedAt)}</td>
                    <td className="px-5 py-3 text-xs text-[#5c647a]">
                      {isRevoked ? (
                        <span className="text-red-600 font-bold">Révoquée</span>
                      ) : isExpired ? (
                        <span className="text-red-600 font-bold">Expirée</span>
                      ) : (
                        fmtDate(k.expiresAt)
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isRevoked && (
                        <button
                          onClick={async () => {
                            const ok = await confirmAction({
                              title: `Révoquer la clé "${k.name}" ?`,
                              message: "Cette action est irréversible. La clé ne pourra plus être utilisée.",
                              confirmLabel: "Révoquer",
                              confirmVariant: "danger",
                              icon: "key_off",
                            });
                            if (ok) {
                              revokeMut.mutate(k.id);
                            }
                          }}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                          title="Révoquer la clé"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#006e2f]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#006e2f]">key</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Nouvelle clé API</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <span className="material-symbols-outlined text-[20px] text-gray-500">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Nom de la clé *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Production server, Zapier integration..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Permissions (scopes)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {ALL_SCOPES.map((s) => {
                    const checked = form.scopes.includes(s);
                    return (
                      <label
                        key={s}
                        className={`flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded-lg border transition-colors ${
                          checked ? "bg-[#006e2f]/5 border-[#006e2f]/30" : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, scopes: [...form.scopes, s] });
                            } else {
                              setForm({ ...form, scopes: form.scopes.filter((x) => x !== s) });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded accent-[#006e2f] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="tabular-nums font-bold text-[10px] text-[#191c1e] truncate">{s}</p>
                          <p className="text-[10px] text-[#5c647a] truncate">{SCOPE_LABELS[s].label}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Expiration</label>
                <select
                  value={form.expiresInDays ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, expiresInDays: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30"
                >
                  <option value="">Jamais</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                  <option value="365">1 an</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => setShowForm(false)}
                disabled={createMut.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-white"
              >
                Annuler
              </button>
              <button
                onClick={() => createMut.mutate(form)}
                disabled={createMut.isPending || !form.name.trim() || form.scopes.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {createMut.isPending ? (
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px]">key</span>
                )}
                Générer la clé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
