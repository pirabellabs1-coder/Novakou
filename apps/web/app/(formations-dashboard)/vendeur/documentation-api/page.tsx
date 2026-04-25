"use client";

import Link from "next/link";
import { useState } from "react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/products",
    description: "Liste vos produits (formations + produits digitaux)",
    scopes: ["read:products"],
    params: [
      { name: "page", type: "number", desc: "Page (defaut: 1)" },
      { name: "limit", type: "number", desc: "Resultats par page (defaut: 20, max: 100)" },
      { name: "status", type: "string", desc: "Filtrer par statut : ACTIF, BROUILLON, ARCHIVE" },
    ],
    response: `{
  "data": [
    {
      "id": "clx...",
      "slug": "marketing-digital",
      "title": "Marketing Digital",
      "price": 45000,
      "status": "ACTIF",
      "kind": "formation",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/products/:id",
    description: "Details d'un produit specifique",
    scopes: ["read:products"],
    params: [],
    response: `{
  "data": {
    "id": "clx...",
    "slug": "marketing-digital",
    "title": "Marketing Digital",
    "description": "...",
    "price": 45000,
    "originalPrice": 65000,
    "status": "ACTIF",
    "kind": "formation",
    "modules": 5,
    "lessons": 24,
    "duration": 480,
    "thumbnail": "https://...",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/orders",
    description: "Liste vos commandes recues",
    scopes: ["read:orders"],
    params: [
      { name: "page", type: "number", desc: "Page (defaut: 1)" },
      { name: "status", type: "string", desc: "Filtrer : PENDING, PAID, REFUNDED" },
      { name: "from", type: "string", desc: "Date debut (ISO 8601)" },
      { name: "to", type: "string", desc: "Date fin (ISO 8601)" },
    ],
    response: `{
  "data": [
    {
      "id": "ord_...",
      "productId": "clx...",
      "productTitle": "Marketing Digital",
      "buyerEmail": "alice@example.com",
      "amount": 45000,
      "currency": "XOF",
      "status": "PAID",
      "createdAt": "2026-04-20T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 128 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/customers",
    description: "Liste vos clients (acheteurs)",
    scopes: ["read:customers"],
    params: [
      { name: "page", type: "number", desc: "Page (defaut: 1)" },
      { name: "search", type: "string", desc: "Recherche par nom ou email" },
    ],
    response: `{
  "data": [
    {
      "id": "usr_...",
      "name": "Alice Dupont",
      "email": "alice@example.com",
      "totalSpent": 135000,
      "ordersCount": 3,
      "firstPurchaseAt": "2026-02-10T09:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 56 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/analytics/revenue",
    description: "Statistiques de revenus par periode",
    scopes: ["read:analytics"],
    params: [
      { name: "from", type: "string", desc: "Date debut (ISO 8601)" },
      { name: "to", type: "string", desc: "Date fin (ISO 8601)" },
      { name: "groupBy", type: "string", desc: "day, week, month (defaut: day)" },
    ],
    response: `{
  "data": {
    "total": 2450000,
    "currency": "XOF",
    "period": { "from": "2026-04-01", "to": "2026-04-25" },
    "breakdown": [
      { "date": "2026-04-01", "revenue": 95000, "orders": 3 },
      { "date": "2026-04-02", "revenue": 180000, "orders": 5 }
    ]
  }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/webhooks/test",
    description: "Envoyer un evenement test a votre webhook",
    scopes: ["admin"],
    params: [
      { name: "webhookId", type: "string", desc: "ID du webhook a tester" },
      { name: "event", type: "string", desc: "Type d'evenement : order.created, order.paid, refund.created" },
    ],
    response: `{
  "success": true,
  "delivery": {
    "statusCode": 200,
    "duration": 142
  }
}`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

const WEBHOOK_EVENTS = [
  { event: "order.created", desc: "Nouvelle commande placee" },
  { event: "order.paid", desc: "Paiement confirme" },
  { event: "order.refunded", desc: "Remboursement effectue" },
  { event: "product.published", desc: "Produit publie" },
  { event: "review.created", desc: "Nouvel avis client" },
  { event: "customer.created", desc: "Nouveau client enregistre" },
];

export default function DocumentationApiPage() {
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [activeTab, setActiveTab] = useState<"endpoints" | "auth" | "webhooks" | "errors">("endpoints");

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#5c647a] mb-2">
        <Link href="/vendeur/dashboard" className="hover:text-[#006e2f] transition-colors">
          Espace vendeur
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#191c1e] font-medium">Documentation API</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Documentation API</h1>
          <p className="text-sm text-[#5c647a] mt-1 max-w-xl">
            Reference complete de l&apos;API Novakou pour integrer votre boutique a vos outils.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendeur/api-keys"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#191c1e] hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            Mes cles API
          </Link>
          <Link
            href="/vendeur/webhooks"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#191c1e] hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">webhook</span>
            Webhooks
          </Link>
        </div>
      </div>

      {/* Base URL banner */}
      <div className="bg-zinc-900 text-white rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-emerald-400 text-[20px] mt-0.5">terminal</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Base URL</p>
            <code className="text-sm tabular-nums text-emerald-400 break-all">https://novakou.com/api/v1</code>
            <p className="text-xs text-zinc-500 mt-2">
              Toutes les requetes doivent inclure l&apos;en-tete{" "}
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Authorization: Bearer nk_live_xxx</code>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {(["endpoints", "auth", "webhooks", "errors"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#006e2f] text-[#006e2f]"
                : "border-transparent text-[#5c647a] hover:text-[#191c1e]"
            }`}
          >
            {tab === "endpoints" && "Endpoints"}
            {tab === "auth" && "Authentification"}
            {tab === "webhooks" && "Webhooks"}
            {tab === "errors" && "Codes d'erreur"}
          </button>
        ))}
      </div>

      {/* Endpoints tab */}
      {activeTab === "endpoints" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - endpoint list */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">Endpoints disponibles</p>
              </div>
              <div className="divide-y divide-gray-50">
                {ENDPOINTS.map((ep, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveEndpoint(i)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      activeEndpoint === i ? "bg-[#006e2f]/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-xs tabular-nums text-[#191c1e] truncate">{ep.path}</code>
                    </div>
                    <p className="text-[11px] text-[#5c647a] truncate">{ep.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main - endpoint detail */}
          <div className="lg:col-span-8 space-y-4">
            {(() => {
              const ep = ENDPOINTS[activeEndpoint];
              return (
                <>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm tabular-nums font-bold text-[#191c1e]">{ep.path}</code>
                    </div>
                    <p className="text-sm text-[#5c647a]">{ep.description}</p>

                    <div className="flex gap-1.5 mt-3">
                      {ep.scopes.map((s) => (
                        <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {ep.params.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">Parametres</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-5 py-2 text-[10px] font-bold text-[#5c647a] uppercase">Nom</th>
                            <th className="text-left px-5 py-2 text-[10px] font-bold text-[#5c647a] uppercase">Type</th>
                            <th className="text-left px-5 py-2 text-[10px] font-bold text-[#5c647a] uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name} className="border-b border-gray-50 last:border-0">
                              <td className="px-5 py-2">
                                <code className="text-xs font-bold text-[#191c1e] bg-gray-50 px-1.5 py-0.5 rounded">{p.name}</code>
                              </td>
                              <td className="px-5 py-2 text-xs text-[#5c647a]">{p.type}</td>
                              <td className="px-5 py-2 text-xs text-[#5c647a]">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="bg-zinc-900 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-zinc-400">data_object</span>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Reponse exemple</p>
                    </div>
                    <pre className="p-5 text-xs text-emerald-400 overflow-x-auto tabular-nums leading-relaxed">
                      {ep.response}
                    </pre>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Auth tab */}
      {activeTab === "auth" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#191c1e]">Authentification par cle API</h2>
            <p className="text-sm text-[#5c647a] leading-relaxed">
              Chaque requete vers l&apos;API Novakou doit inclure votre cle API dans l&apos;en-tete HTTP
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mx-1">Authorization</code>.
            </p>

            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Exemple cURL</p>
              <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
{`curl -X GET https://novakou.com/api/v1/products \\
  -H "Authorization: Bearer nk_live_votre_cle_ici" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>

            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Exemple JavaScript (fetch)</p>
              <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
{`const response = await fetch("https://novakou.com/api/v1/products", {
  headers: {
    "Authorization": "Bearer nk_live_votre_cle_ici",
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log(data);`}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#191c1e]">Scopes (permissions)</h2>
            <p className="text-sm text-[#5c647a]">
              Chaque cle API possede des scopes qui limitent les actions autorisees.
            </p>
            <div className="space-y-2">
              {[
                { scope: "read:products", desc: "Lire la liste et les details de vos produits" },
                { scope: "write:products", desc: "Creer, modifier et supprimer des produits" },
                { scope: "read:orders", desc: "Lire les commandes et leur statut" },
                { scope: "write:orders", desc: "Mettre a jour le statut des commandes" },
                { scope: "read:customers", desc: "Lire les informations de vos clients" },
                { scope: "write:customers", desc: "Modifier les informations clients" },
                { scope: "read:analytics", desc: "Acceder aux statistiques et rapports" },
                { scope: "admin", desc: "Acces complet a toutes les ressources" },
              ].map((s) => (
                <div key={s.scope} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <code className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">{s.scope}</code>
                  <p className="text-sm text-[#5c647a]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[20px] mt-0.5">security</span>
            <div className="text-sm text-amber-900">
              <p className="font-bold">Securite</p>
              <p className="text-xs mt-1">
                Ne partagez jamais votre cle API. Ne l&apos;incluez pas dans du code frontend ou des depots publics.
                Utilisez des variables d&apos;environnement cote serveur uniquement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks tab */}
      {activeTab === "webhooks" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#191c1e]">Webhooks</h2>
            <p className="text-sm text-[#5c647a] leading-relaxed">
              Les webhooks envoient des notifications HTTP POST a votre serveur lorsqu&apos;un evenement se produit
              dans votre boutique. Configurez vos webhooks dans{" "}
              <Link href="/vendeur/webhooks" className="text-[#006e2f] font-semibold hover:underline">
                Parametres &gt; Webhooks
              </Link>.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">Evenements disponibles</p>
            </div>
            <div className="divide-y divide-gray-50">
              {WEBHOOK_EVENTS.map((ev) => (
                <div key={ev.event} className="px-5 py-3 flex items-center gap-3">
                  <code className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">{ev.event}</code>
                  <p className="text-sm text-[#5c647a]">{ev.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Exemple de payload webhook</p>
            </div>
            <pre className="p-5 text-xs text-emerald-400 overflow-x-auto tabular-nums leading-relaxed">
{`{
  "event": "order.paid",
  "timestamp": "2026-04-25T14:30:00Z",
  "data": {
    "orderId": "ord_abc123",
    "productId": "clx...",
    "productTitle": "Marketing Digital",
    "buyerEmail": "alice@example.com",
    "amount": 45000,
    "currency": "XOF"
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Errors tab */}
      {activeTab === "errors" && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">Codes HTTP</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { code: "200", label: "OK", desc: "Requete reussie", color: "bg-emerald-50 text-emerald-700" },
                { code: "201", label: "Created", desc: "Ressource creee avec succes", color: "bg-emerald-50 text-emerald-700" },
                { code: "400", label: "Bad Request", desc: "Parametres manquants ou invalides", color: "bg-amber-50 text-amber-700" },
                { code: "401", label: "Unauthorized", desc: "Cle API manquante ou invalide", color: "bg-red-50 text-red-700" },
                { code: "403", label: "Forbidden", desc: "Scope insuffisant pour cette action", color: "bg-red-50 text-red-700" },
                { code: "404", label: "Not Found", desc: "Ressource introuvable", color: "bg-gray-50 text-gray-700" },
                { code: "429", label: "Too Many Requests", desc: "Limite de requetes atteinte (100/min)", color: "bg-orange-50 text-orange-700" },
                { code: "500", label: "Server Error", desc: "Erreur interne — contactez le support", color: "bg-red-50 text-red-700" },
              ].map((err) => (
                <div key={err.code} className="px-5 py-3 flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded tabular-nums ${err.color}`}>{err.code}</span>
                  <span className="text-sm font-bold text-[#191c1e] w-32">{err.label}</span>
                  <p className="text-sm text-[#5c647a]">{err.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Format d&apos;erreur</p>
            </div>
            <pre className="p-5 text-xs text-red-400 overflow-x-auto tabular-nums leading-relaxed">
{`{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "La cle API fournie est invalide ou revoquee.",
    "status": 401
  }
}`}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">rate_review</span>
            <div className="text-sm text-blue-900">
              <p className="font-bold">Rate Limiting</p>
              <p className="text-xs mt-1">
                L&apos;API est limitee a 100 requetes par minute par cle. Les en-tetes
                <code className="bg-white px-1 py-0.5 rounded mx-1">X-RateLimit-Remaining</code> et
                <code className="bg-white px-1 py-0.5 rounded mx-1">X-RateLimit-Reset</code> sont inclus dans chaque reponse.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
