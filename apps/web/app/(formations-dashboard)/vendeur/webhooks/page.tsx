"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  lastFiredAt: string | null;
  failureCount: number;
  createdAt: string;
};

type ApiResp = {
  data: Webhook[];
  supportedEvents: string[];
};

const EVENT_LABELS: Record<string, { label: string; desc: string }> = {
  "order.paid": { label: "Commande payée", desc: "Un acheteur confirme son paiement → produit livré" },
  "order.refunded": { label: "Remboursement", desc: "Un remboursement admin-approuvé a été effectué" },
  "review.created": { label: "Nouvel avis", desc: "Un apprenant laisse une note sur un de vos produits" },
  "withdrawal.processed": { label: "Retrait traité", desc: "Votre demande de retrait passe à TRAITE ou REFUSE" },
  "subscription.created": { label: "Abonnement créé", desc: "Nouveau subscriber à un de vos plans (V2)" },
  "subscription.renewed": { label: "Abonnement renouvelé", desc: "Paiement récurrent réussi (V2)" },
  "subscription.cancelled": { label: "Abonnement annulé", desc: "Un subscriber annule son plan (V2)" },
};

export default function VendorWebhooksPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSecretId, setShowSecretId] = useState<string | null>(null);

  // Form
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["order.paid"]);
  const [customSecret, setCustomSecret] = useState("");

  const { data, isLoading } = useQuery<ApiResp>({
    queryKey: ["vendeur-webhooks"],
    queryFn: () => fetch("/api/formations/vendeur/webhooks").then((r) => r.json()),
    staleTime: 30_000,
  });
  const webhooks = data?.data ?? [];
  const supportedEvents = data?.supportedEvents ?? [];

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/formations/vendeur/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events, secret: customSecret || undefined }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Webhook créé ✓");
      qc.invalidateQueries({ queryKey: ["vendeur-webhooks"] });
      setShowCreate(false);
      setUrl(""); setEvents(["order.paid"]); setCustomSecret("");
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const toggleMut = useMutation({
    mutationFn: async (args: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/formations/vendeur/webhooks/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: args.isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendeur-webhooks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/vendeur/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      return res.json();
    },
    onSuccess: () => {
      setToast("Webhook supprimé");
      qc.invalidateQueries({ queryKey: ["vendeur-webhooks"] });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const testMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/vendeur/webhooks/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const j = await res.json();
      return j;
    },
    onSuccess: (data) => {
      const result = data?.data;
      if (result?.ok) {
        setToast(`✓ Test envoyé (HTTP ${result.httpStatus}, ${result.durationMs}ms)`);
      } else {
        setToast(`✗ Échec test : ${result?.error || "HTTP " + result?.httpStatus}`);
      }
      qc.invalidateQueries({ queryKey: ["vendeur-webhooks"] });
      setTimeout(() => setToast(null), 5000);
    },
  });

  async function handleDelete(wh: Webhook) {
    const ok = await confirmAction({
      title: "Supprimer ce webhook ?",
      message: `L'URL ${wh.url} ne recevra plus les événements.`,
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (ok) deleteMut.mutate(wh.id);
  }

  function toggleEvent(evt: string) {
    setEvents((prev) => prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]);
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Webhooks sortants</h1>
          <p className="text-sm text-[#5c647a] mt-1 max-w-2xl">
            Recevez une notification POST en temps réel dès qu'un événement se produit
            sur votre boutique (vente, avis, retrait…). Idéal pour brancher Zapier, Make,
            n8n, ou votre propre backend.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau webhook
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[0,1].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : webhooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">webhook</span>
          <h3 className="text-lg font-bold text-[#191c1e] mt-3">Aucun webhook configuré</h3>
          <p className="text-sm text-[#5c647a] mt-2 max-w-md mx-auto">
            Configurez une URL pour recevoir des notifications JSON en temps réel.
            Parfait pour automatiser avec Zapier, Make, ou votre CRM.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Créer mon premier webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${wh.isActive ? "bg-[#006e2f]/10 text-[#006e2f]" : "bg-gray-100 text-[#5c647a]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${wh.isActive ? "bg-[#006e2f]" : "bg-gray-300"}`} />
                      {wh.isActive ? "Actif" : "Inactif"}
                    </span>
                    {wh.failureCount > 0 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {wh.failureCount} échec{wh.failureCount > 1 ? "s" : ""} récent{wh.failureCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono font-bold text-[#191c1e] break-all mb-2">{wh.url}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wh.events.map((e) => (
                      <span key={e} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {e}
                      </span>
                    ))}
                  </div>
                  {wh.lastFiredAt && (
                    <p className="text-[10px] text-[#5c647a] mt-2">
                      Dernier envoi : {new Date(wh.lastFiredAt).toLocaleString("fr-FR")}
                    </p>
                  )}
                  {wh.secret && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">
                        Secret HMAC (X-Novakou-Signature header)
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[#191c1e] break-all flex-1">
                          {showSecretId === wh.id ? wh.secret : "•".repeat(24)}
                        </code>
                        <button
                          onClick={() => setShowSecretId(showSecretId === wh.id ? null : wh.id)}
                          className="text-[10px] font-bold text-[#006e2f] hover:underline flex-shrink-0"
                        >
                          {showSecretId === wh.id ? "Masquer" : "Voir"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => testMut.mutate(wh.id)}
                    disabled={testMut.isPending}
                    className="p-2 rounded-lg hover:bg-blue-50 text-[#5c647a] hover:text-blue-600"
                    title="Envoyer un event de test"
                  >
                    <span className="material-symbols-outlined text-[18px]">science</span>
                  </button>
                  <button
                    onClick={() => toggleMut.mutate({ id: wh.id, isActive: !wh.isActive })}
                    disabled={toggleMut.isPending}
                    className="p-2 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                    title={wh.isActive ? "Désactiver" : "Activer"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {wh.isActive ? "toggle_on" : "toggle_off"}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(wh)}
                    disabled={deleteMut.isPending}
                    className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Format details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-6">
        <h3 className="text-sm font-bold text-[#191c1e] mb-3">Format du payload</h3>
        <pre className="text-[11px] font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto text-[#191c1e]">
{`POST https://votre-url.com/webhook
Content-Type: application/json
X-Novakou-Event: order.paid
X-Novakou-Signature: sha256=<hex HMAC-SHA256 du body avec votre secret>

{
  "event": "order.paid",
  "webhook_id": "...",
  "timestamp": "2026-04-24T12:34:56.789Z",
  "data": {
    "sessionRef": "...",
    "subTotal": 25000,
    "totalAmount": 27900,
    "buyer": { "email": "...", "name": "..." },
    "enrollments": [...],
    "purchases": [...]
  }
}`}
        </pre>
        <p className="text-[11px] text-[#5c647a] mt-3">
          <strong>Vérif signature</strong> : calculez HMAC-SHA256 du body brut avec votre secret, comparez au header X-Novakou-Signature (préfixé par <code>sha256=</code>).
          Votre endpoint doit répondre HTTP 2xx sous 10s. Après 10 échecs consécutifs, le webhook est auto-désactivé.
        </p>
      </div>

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
            <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Nouveau webhook</h2>
            <p className="text-sm text-[#5c647a] mb-5">
              Votre endpoint recevra une requête POST JSON dès que l'un des événements sélectionnés se produit.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1.5">URL du webhook</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://votre-app.com/api/webhook/novakou"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-2">
                  Événements à suivre ({events.length} sélectionnés)
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {supportedEvents.map((evt) => {
                    const info = EVENT_LABELS[evt] || { label: evt, desc: "" };
                    const selected = events.includes(evt);
                    return (
                      <label
                        key={evt}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected ? "border-[#006e2f] bg-[#006e2f]/5" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleEvent(evt)}
                          className="mt-0.5 w-4 h-4 accent-[#006e2f]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#191c1e]">{info.label}</p>
                          <p className="text-[11px] text-[#5c647a] mt-0.5">{info.desc}</p>
                          <code className="text-[10px] font-mono text-[#006e2f] mt-1 block">{evt}</code>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1.5">
                  Secret HMAC <span className="font-normal text-[#5c647a]">(optionnel, auto-généré sinon)</span>
                </label>
                <input
                  type="text"
                  value={customSecret}
                  onChange={(e) => setCustomSecret(e.target.value)}
                  placeholder="Min 16 chars, ou laisser vide pour auto-génération"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
                />
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
                  disabled={createMut.isPending || !url || events.length === 0}
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
