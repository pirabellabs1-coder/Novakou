"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Endpoints définis ────────────────────────────────────────────────────────
interface CodeSample {
  curl: string;
  node: string;
  python: string;
  php: string;
}

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description: string;
  scope: string;
  category: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  samples: CodeSample;
}

const BASE_URL = "https://novakou.com";

function buildSamples(method: string, path: string, query?: string): CodeSample {
  const fullUrl = `${BASE_URL}${path}${query ?? ""}`;
  return {
    curl: `curl -X ${method} "${fullUrl}" \\
  -H "Authorization: Bearer nk_live_VOTRE_CLE_ICI"`,
    node: `import fetch from "node-fetch";

const res = await fetch("${fullUrl}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer nk_live_VOTRE_CLE_ICI",
    "Content-Type": "application/json",
  },
});
const data = await res.json();
console.log(data);`,
    python: `import requests

res = requests.${method.toLowerCase()}(
    "${fullUrl}",
    headers={"Authorization": "Bearer nk_live_VOTRE_CLE_ICI"},
)
print(res.json())`,
    php: `<?php
$ch = curl_init("${fullUrl}");
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer nk_live_VOTRE_CLE_ICI",
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$body = curl_exec($ch);
curl_close($ch);
print_r(json_decode($body, true));`,
  };
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/products",
    summary: "Lister vos produits",
    description:
      "Retourne la liste paginée des produits digitaux que vous avez publiés sur Novakou.",
    scope: "read:products",
    category: "Produits",
    params: [
      { name: "page", type: "number", required: false, description: "Numéro de page (défaut: 1)" },
      { name: "limit", type: "number", required: false, description: "Produits par page (max: 100, défaut: 20)" },
    ],
    response: `{
  "data": [
    {
      "id": "prod_abc123",
      "slug": "formation-marketing-digital",
      "title": "Formation Marketing Digital",
      "description": "Apprenez les bases...",
      "price": 29900,
      "currency": "XOF",
      "productType": "FORMATION",
      "createdAt": "2026-04-15T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`,
    samples: buildSamples("GET", "/api/v1/products", "?page=1&limit=20"),
  },
  {
    method: "GET",
    path: "/api/v1/orders",
    summary: "Lister vos commandes",
    description:
      "Retourne toutes les commandes (formations + produits digitaux) de vos clients, triées par date décroissante.",
    scope: "read:orders",
    category: "Commandes",
    params: [
      { name: "page", type: "number", required: false, description: "Numéro de page" },
      { name: "limit", type: "number", required: false, description: "Résultats par page (max: 100)" },
    ],
    response: `{
  "data": [
    {
      "id": "ord_xyz789",
      "type": "formation",
      "amount": 29900,
      "currency": "XOF",
      "status": "paid",
      "customer": { "id": "usr_abc", "email": "client@exemple.com", "name": "Client Test" },
      "item": { "title": "Formation Marketing Digital", "slug": "...", "price": 29900 },
      "createdAt": "2026-04-15T14:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "count": 1 }
}`,
    samples: buildSamples("GET", "/api/v1/orders", "?page=1"),
  },
  {
    method: "GET",
    path: "/api/v1/customers",
    summary: "Lister vos clients",
    description:
      "Retourne la liste unique des clients qui ont acheté au moins un produit chez vous, avec métriques agrégées (total dépensé, nombre de commandes, date du premier achat).",
    scope: "read:customers",
    category: "Clients",
    params: [
      { name: "page", type: "number", required: false, description: "Numéro de page" },
      { name: "limit", type: "number", required: false, description: "Clients par page (max: 100)" },
    ],
    response: `{
  "data": [
    {
      "id": "usr_abc123",
      "email": "client@exemple.com",
      "name": "Amina Diallo",
      "image": null,
      "country": "SN",
      "totalSpent": 58900,
      "ordersCount": 3,
      "firstPurchaseAt": "2026-02-14T09:15:00.000Z",
      "currency": "XOF"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 127, "totalPages": 7 }
}`,
    samples: buildSamples("GET", "/api/v1/customers"),
  },
  {
    method: "GET",
    path: "/api/v1/analytics",
    summary: "Statistiques de vente",
    description:
      "Retourne un résumé chiffré de votre activité (revenus, commandes, clients uniques, panier moyen) sur la période choisie.",
    scope: "read:analytics",
    category: "Analytics",
    params: [
      {
        name: "period",
        type: "string",
        required: false,
        description: "Période d'analyse : `7d`, `30d` (défaut), `90d`, `all`",
      },
    ],
    response: `{
  "data": {
    "period": "30d",
    "since": "2026-03-17T22:00:00.000Z",
    "revenue": {
      "total": 487400,
      "fromFormations": 329900,
      "fromProducts": 157500,
      "currency": "XOF"
    },
    "orders": { "total": 24, "formations": 11, "products": 13 },
    "customers": { "unique": 18 },
    "avgOrderValue": 20308
  }
}`,
    samples: buildSamples("GET", "/api/v1/analytics", "?period=30d"),
  },
];

const SCOPES = [
  { name: "read:products", description: "Lire vos produits digitaux" },
  { name: "write:products", description: "Créer/modifier vos produits (bientôt)" },
  { name: "read:orders", description: "Lire vos commandes et clients" },
  { name: "write:orders", description: "Modifier le statut de commandes (bientôt)" },
  { name: "read:customers", description: "Lire les infos clients" },
  { name: "read:analytics", description: "Lire vos statistiques de vente" },
  { name: "admin", description: "Toutes les permissions (usage prudent)" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-[#006e2f] text-white",
  POST: "bg-blue-600 text-white",
  PATCH: "bg-amber-500 text-white",
  DELETE: "bg-red-600 text-white",
};

type Lang = "curl" | "node" | "python" | "php";
const LANG_LABELS: Record<Lang, string> = {
  curl: "cURL",
  node: "Node.js",
  python: "Python",
  php: "PHP",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DeveloperDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<string>(ENDPOINTS[0].path);
  const [copied, setCopied] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("curl");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const current = ENDPOINTS.find((e) => e.path === activeEndpoint) ?? ENDPOINTS[0];

  // Group endpoints by category for sidebar
  const byCategory = ENDPOINTS.reduce((acc, e) => {
    (acc[e.category] = acc[e.category] ?? []).push(e);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  async function copyCode(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* ═════════ Header ═════════ */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: "linear-gradient(135deg,#003d1a 0%,#006e2f 50%,#22c55e 100%)" }}
            >
              <span className="text-white font-extrabold text-sm">N</span>
            </div>
            <div>
              <p className="font-extrabold text-[#191c1e] leading-none">Novakou</p>
              <p className="text-[10px] text-[#5c647a] leading-none mt-0.5">Developer docs</p>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <a href="#overview" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">Vue</a>
            <a href="#sdks" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">SDKs</a>
            <a href="#auth" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">Auth</a>
            <a href="#endpoints" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">Endpoints</a>
            <a href="#webhooks" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">Webhooks</a>
            <a href="#guides" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">Guides</a>
            <a href="#faq" className="px-3 py-2 rounded-lg text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]">FAQ</a>
          </nav>
          <Link
            href="/vendeur/api-keys"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            Mes clés API
          </Link>
        </div>
      </header>

      {/* ═════════ Hero ═════════ */}
      <section
        id="overview"
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #003d1a 0%, #006e2f 40%, #22c55e 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <span className="material-symbols-outlined text-[14px]">code</span>
              API v1
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              API Novakou
              <br />
              <span className="text-white/80 font-bold">pour vendeurs</span>
            </h1>
            <p className="text-base md:text-lg text-white/90 mt-5 max-w-2xl">
              Intégrez votre boutique Novakou à n&apos;importe quelle application.
              Récupérez vos produits, commandes et clients via une API REST simple, sécurisée et bien documentée.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/vendeur/api-keys"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#006e2f] text-sm font-bold hover:bg-white/90 shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                Générer ma clé
              </Link>
              <a
                href="#endpoints"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-white/30 text-white text-sm font-bold hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Explorer les endpoints
              </a>
            </div>
            {/* Quickstart code */}
            <div className="mt-10 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-5 max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/60">Quickstart</span>
                <button
                  onClick={() =>
                    copyCode(
                      "quickstart",
                      `curl -X GET "${BASE_URL}/api/v1/products" \\\n  -H "Authorization: Bearer nk_live_VOTRE_CLE"`,
                    )
                  }
                  className="text-[10px] text-white/70 hover:text-white flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied === "quickstart" ? "check" : "content_copy"}
                  </span>
                  {copied === "quickstart" ? "Copié !" : "Copier"}
                </button>
              </div>
              <pre className="text-[13px] tabular-nums text-white/90 overflow-x-auto whitespace-pre">
{`curl -X GET "${BASE_URL}/api/v1/products" \\
  -H "Authorization: Bearer `}
                <span className="text-emerald-300">nk_live_VOTRE_CLE</span>
                {`"`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ Key concepts ═════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "lock",
              title: "Sécurisé",
              desc: "Auth par clé API, hashée SHA-256 côté serveur. Scopes granulaires.",
            },
            {
              icon: "speed",
              title: "Rapide",
              desc: "Réponses en < 200 ms. Pagination intégrée. Filtrage par requête.",
            },
            {
              icon: "integration_instructions",
              title: "Standard REST",
              desc: "JSON, HTTPS, codes HTTP standards. Compatible tout langage.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-[#006e2f]/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[22px] text-[#006e2f]">{f.icon}</span>
              </div>
              <h3 className="font-extrabold text-[#191c1e] text-base">{f.title}</h3>
              <p className="text-sm text-[#5c647a] mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ SDKs officiels ═════════ */}
      <section id="sdks" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">Installation</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mt-1">SDKs officiels</h2>
            <p className="text-[#5c647a] mt-2 max-w-2xl">
              Intégrez l&apos;API Novakou en une ligne avec nos bibliothèques open-source. Support TypeScript, types auto-complétés, gestion des erreurs intégrée.
            </p>
          </div>
          <a
            href="https://github.com/novakou"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#191c1e] hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            Voir sur GitHub
          </a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "Node.js",
              version: "v1.2.0",
              bg: "from-emerald-500 to-green-600",
              icon: "javascript",
              install: "npm install @novakou/sdk",
              snippet: `import Novakou from '@novakou/sdk';\nconst nk = new Novakou(apiKey);`,
            },
            {
              name: "Python",
              version: "v1.1.4",
              bg: "from-blue-500 to-sky-600",
              icon: "terminal",
              install: "pip install novakou",
              snippet: `import novakou\nclient = novakou.Client(api_key)`,
            },
            {
              name: "PHP",
              version: "v1.0.8",
              bg: "from-indigo-500 to-purple-600",
              icon: "php",
              install: "composer require novakou/novakou-php",
              snippet: `$nk = new Novakou\\Client($apiKey);`,
            },
            {
              name: "Ruby",
              version: "v0.9.2",
              bg: "from-rose-500 to-red-600",
              icon: "diamond",
              install: "gem install novakou",
              snippet: `Novakou.api_key = 'nk_live_...'`,
            },
          ].map((sdk) => (
            <div
              key={sdk.name}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#006e2f]/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${sdk.bg}`}>
                  <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{sdk.icon}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">Officiel</span>
                  <p className="text-[10px] text-[#5c647a] tabular-nums mt-1">{sdk.version}</p>
                </div>
              </div>
              <h3 className="font-extrabold text-[#191c1e] text-base mb-3">{sdk.name}</h3>
              <div className="bg-[#0f172a] rounded-lg p-2.5 mb-2">
                <code className="text-[11px] tabular-nums text-emerald-300 break-all">{sdk.install}</code>
              </div>
              <div className="bg-[#f7f9fb] rounded-lg p-2.5">
                <pre className="text-[10px] tabular-nums text-[#191c1e] whitespace-pre-wrap leading-relaxed">{sdk.snippet}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ Authentication ═════════ */}
      <section id="auth" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Authentification</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          Toutes les requêtes doivent inclure votre clé API dans l&apos;en-tête{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded tabular-nums text-[12px]">Authorization</code> au format Bearer.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Étape 1</p>
            <h3 className="font-extrabold text-[#191c1e]">Générez votre clé</h3>
            <p className="text-sm text-[#5c647a] mt-1">
              Depuis votre dashboard Novakou → Clés API → « Nouvelle clé ». Choisissez les scopes et la date d&apos;expiration.
            </p>
            <Link
              href="/vendeur/api-keys"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#006e2f] hover:underline"
            >
              Ouvrir le dashboard
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Étape 2</p>
            <h3 className="font-extrabold text-[#191c1e]">Utilisez-la dans vos requêtes</h3>
            <pre className="text-[12px] tabular-nums bg-[#191c1e] text-emerald-300 p-3 rounded-lg mt-2 overflow-x-auto whitespace-pre">
{`Authorization: Bearer nk_live_abc123...`}
            </pre>
            <p className="text-[10px] text-[#5c647a] mt-2">
              🔒 Ne partagez JAMAIS votre clé. Révoquez-la immédiatement si compromise.
            </p>
          </div>
        </div>
      </section>

      {/* ═════════ Scopes ═════════ */}
      <section id="scopes" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Scopes (permissions)</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          Chaque clé API est limitée aux scopes que vous avez choisis. Principe du moindre privilège.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase">Scope</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#5c647a] uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {SCOPES.map((s) => (
                <tr key={s.name} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <code className="tabular-nums text-xs bg-[#006e2f]/10 text-[#006e2f] px-2 py-1 rounded font-bold">
                      {s.name}
                    </code>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#5c647a]">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═════════ Endpoints ═════════ */}
      <section id="endpoints" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-6">Endpoints API</h2>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-4">
              {Object.entries(byCategory).map(([cat, endpoints]) => (
                <div key={cat}>
                  <p className="text-[10px] font-bold uppercase text-[#5c647a] px-3 py-2">{cat}</p>
                  <div className="space-y-1">
                    {endpoints.map((e) => (
                      <button
                        key={e.path}
                        onClick={() => setActiveEndpoint(e.path)}
                        className={`w-full text-left p-2.5 rounded-xl transition-colors ${
                          activeEndpoint === e.path ? "bg-[#006e2f]/10" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[e.method]}`}>
                            {e.method}
                          </span>
                          <code className="text-[11px] tabular-nums text-[#191c1e] truncate">
                            {e.path.replace("/api/v1", "")}
                          </code>
                        </div>
                        <p className="text-[11px] text-[#5c647a] leading-tight">{e.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Endpoint details */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded ${METHOD_COLORS[current.method]}`}>
                  {current.method}
                </span>
                <code className="text-sm tabular-nums text-[#191c1e]">{current.path}</code>
              </div>
              <h3 className="text-xl font-extrabold text-[#191c1e]">{current.summary}</h3>
              <p className="text-sm text-[#5c647a] mt-1">{current.description}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="material-symbols-outlined text-[12px]">shield</span>
                Requiert le scope : <code className="tabular-nums">{current.scope}</code>
              </div>
            </div>

            {/* Code samples — multi-langage */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wide">Exemple d&apos;utilisation</h4>
                <button
                  onClick={() => copyCode(`code-${current.path}-${lang}`, current.samples[lang])}
                  className="text-xs text-[#006e2f] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied === `code-${current.path}-${lang}` ? "check" : "content_copy"}
                  </span>
                  {copied === `code-${current.path}-${lang}` ? "Copié !" : "Copier"}
                </button>
              </div>
              {/* Tabs langages */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-3">
                {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      lang === l ? "bg-white text-[#006e2f] shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
                    }`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              <pre className="bg-[#191c1e] text-emerald-300 rounded-xl p-4 text-[13px] tabular-nums overflow-x-auto whitespace-pre">
                {current.samples[lang]}
              </pre>
            </div>

            {/* Query params */}
            {current.params && current.params.length > 0 && (
              <div className="p-5 border-b border-gray-100">
                <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wide mb-3">
                  Paramètres de requête
                </h4>
                <div className="space-y-2">
                  {current.params.map((p) => (
                    <div key={p.name} className="flex items-start gap-3 text-sm">
                      <code className="tabular-nums text-xs bg-gray-100 px-2 py-1 rounded font-bold text-[#191c1e] min-w-[80px] text-center">
                        {p.name}
                      </code>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#5c647a] font-semibold">{p.type}</span>
                          {p.required && <span className="text-[10px] font-bold text-red-600">REQUIS</span>}
                        </div>
                        <p className="text-xs text-[#5c647a] mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wide">Réponse (200 OK)</h4>
                <button
                  onClick={() => copyCode(`resp-${current.path}`, current.response)}
                  className="text-xs text-[#006e2f] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied === `resp-${current.path}` ? "check" : "content_copy"}
                  </span>
                  {copied === `resp-${current.path}` ? "Copié !" : "Copier"}
                </button>
              </div>
              <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-[12px] tabular-nums text-[#191c1e] overflow-x-auto whitespace-pre">
                {current.response}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ Pagination ═════════ */}
      <section id="pagination" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Pagination</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          Tous les endpoints qui retournent des listes supportent la pagination par offset (page + limit).
          Les listes incluent un objet <code className="bg-gray-100 px-1.5 py-0.5 rounded tabular-nums text-[12px]">pagination</code> dans la réponse.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Paramètres</p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <code className="tabular-nums text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">page</code>
                <span className="text-[#5c647a]">Numéro de page, commence à <b>1</b></span>
              </li>
              <li className="flex items-start gap-2">
                <code className="tabular-nums text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">limit</code>
                <span className="text-[#5c647a]">Résultats par page, max <b>100</b>, défaut <b>20</b></span>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Réponse</p>
            <pre className="text-[12px] tabular-nums bg-[#191c1e] text-emerald-300 p-3 rounded-lg overflow-x-auto">
{`"pagination": {
  "page": 1,
  "limit": 20,
  "total": 127,
  "totalPages": 7
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ═════════ Rate Limits ═════════ */}
      <section id="rate-limits" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Rate Limits</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          Pour garantir la stabilité du service, chaque clé API est limitée à <b>60 requêtes par minute</b>. Les dépassements retournent un code <code className="bg-gray-100 px-1.5 py-0.5 rounded tabular-nums text-[12px]">429 Too Many Requests</code>.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 max-w-2xl">
          <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Headers de réponse</p>
          <pre className="text-[12px] tabular-nums bg-[#191c1e] text-emerald-300 p-3 rounded-lg overflow-x-auto">
{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1713287400`}
          </pre>
          <p className="text-xs text-[#5c647a] mt-3">
            💡 Si vous atteignez la limite, attendez la valeur de <code className="tabular-nums text-[11px]">X-RateLimit-Reset</code> (timestamp Unix) avant de réessayer.
          </p>
        </div>
      </section>

      {/* ═════════ Webhooks ═════════ */}
      <section id="webhooks" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Webhooks sortants</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          Novakou peut envoyer des événements à votre serveur en temps réel dès qu&apos;une action se produit dans votre boutique (nouvelle vente, remboursement, nouveau client).
          Configurez vos URL webhooks depuis <Link href="/vendeur/automatisations" className="text-[#006e2f] font-bold hover:underline">Espace vendeur → Automatisations → Intégrations</Link>.
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-3xl mb-4">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-[#191c1e] uppercase tracking-wide">Événements disponibles</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {[
                { event: "order.created", desc: "Une nouvelle commande est créée (avant paiement)" },
                { event: "order.paid", desc: "Le paiement d'une commande est confirmé" },
                { event: "order.refunded", desc: "Une commande est remboursée" },
                { event: "customer.created", desc: "Un nouveau client s'est inscrit sur votre boutique" },
                { event: "product.published", desc: "Un produit passe à l'état publié" },
                { event: "sale.milestone", desc: "Palier de ventes atteint (10, 50, 100, 500…)" },
              ].map((e) => (
                <tr key={e.event} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5">
                    <code className="tabular-nums text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded font-bold">
                      {e.event}
                    </code>
                  </td>
                  <td className="px-5 py-2.5 text-[#5c647a] text-xs">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Payload exemple</p>
            <pre className="text-[11px] tabular-nums bg-[#191c1e] text-emerald-300 p-3 rounded-lg overflow-x-auto">
{`{
  "event": "order.paid",
  "timestamp": "2026-04-16T14:30:00.000Z",
  "data": {
    "id": "ord_xyz789",
    "amount": 29900,
    "currency": "XOF",
    "customer": {
      "id": "usr_abc",
      "email": "client@exemple.com"
    }
  }
}`}
            </pre>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold uppercase text-[#5c647a] mb-2">Vérification signature</p>
            <p className="text-xs text-[#5c647a] mb-2">
              Chaque webhook inclut un header <code className="bg-gray-100 px-1.5 py-0.5 rounded tabular-nums text-[11px]">X-Novakou-Signature</code> (HMAC-SHA256 du body, clé = secret configuré).
            </p>
            <pre className="text-[11px] tabular-nums bg-[#191c1e] text-emerald-300 p-3 rounded-lg overflow-x-auto">
{`// Node.js — vérifier la signature
import crypto from "crypto";

const expected = crypto
  .createHmac("sha256", SECRET)
  .update(rawBody)
  .digest("hex");

if (expected !== req.headers["x-novakou-signature"]) {
  return res.status(401).send("invalid signature");
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ═════════ Changelog ═════════ */}
      <section id="changelog" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Changelog</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          Historique des versions de l&apos;API Novakou. Nous suivons le semver : <b>major.minor.patch</b>.
        </p>
        <div className="space-y-3 max-w-3xl">
          {[
            {
              version: "v1.0.0",
              date: "Avril 2026",
              tag: "Initial release",
              tagColor: "bg-[#006e2f] text-white",
              changes: [
                "Endpoints GET /products, /orders, /customers, /analytics",
                "Authentification par clé API Bearer (nk_live_*)",
                "Scopes granulaires (read/write)",
                "Pagination offset (page/limit)",
                "Rate limiting 60 req/min par clé",
              ],
            },
          ].map((v) => (
            <div key={v.version} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <code className="tabular-nums text-lg font-extrabold text-[#191c1e]">{v.version}</code>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.tagColor}`}>
                  {v.tag}
                </span>
                <span className="text-xs text-[#5c647a]">{v.date}</span>
              </div>
              <ul className="space-y-1 text-sm text-[#5c647a] ml-4">
                {v.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[14px] text-[#006e2f] mt-0.5">check</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ Errors ═════════ */}
      <section id="errors" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-2">Codes d&apos;erreur</h2>
        <p className="text-[#5c647a] mb-6 max-w-2xl">
          L&apos;API retourne toujours du JSON. Les erreurs suivent cette structure :
        </p>
        <pre className="bg-[#191c1e] text-emerald-300 rounded-xl p-4 text-[13px] tabular-nums overflow-x-auto mb-6 max-w-2xl whitespace-pre">
{`{
  "error": "Message d'erreur humain",
  "hint": "Comment corriger (optionnel)"
}`}
        </pre>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { code: 401, title: "Unauthorized", desc: "Clé API manquante ou invalide" },
            { code: 403, title: "Forbidden", desc: "Scope insuffisant pour cette action" },
            { code: 404, title: "Not Found", desc: "Ressource introuvable" },
            { code: 429, title: "Too Many Requests", desc: "Rate limit dépassé (60 req/min)" },
            { code: 500, title: "Internal Error", desc: "Erreur serveur côté Novakou" },
          ].map((e) => (
            <div key={e.code} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <span className="font-extrabold text-red-600">{e.code}</span>
              </div>
              <div>
                <p className="font-bold text-[#191c1e] text-sm">{e.title}</p>
                <p className="text-xs text-[#5c647a]">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ Guides & Recettes ═════════ */}
      <section id="guides" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">Recettes</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mt-1">Guides pratiques</h2>
          <p className="text-[#5c647a] mt-2 max-w-2xl">
            Des intégrations prêtes à l&apos;emploi. Copiez, collez, adaptez — et déployez en quelques minutes.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "table_chart",
              bg: "bg-emerald-50",
              color: "text-emerald-600",
              title: "Sync Google Sheets",
              desc: "Envoie chaque nouvelle commande vers une feuille Google Sheets via webhook.",
              level: "Débutant",
              levelColor: "bg-[#006e2f]/10 text-[#006e2f]",
              time: "5 min",
            },
            {
              icon: "chat",
              bg: "bg-indigo-50",
              color: "text-indigo-600",
              title: "Bot Discord communauté",
              desc: "Notifie ton serveur Discord à chaque nouvelle vente avec détails produit et acheteur.",
              level: "Intermédiaire",
              levelColor: "bg-amber-50 text-amber-700",
              time: "15 min",
            },
            {
              icon: "mark_email_read",
              bg: "bg-orange-50",
              color: "text-orange-600",
              title: "Welcome email automatique",
              desc: "Déclenche un email de bienvenue personnalisé à l'achat d'un produit spécifique.",
              level: "Débutant",
              levelColor: "bg-[#006e2f]/10 text-[#006e2f]",
              time: "10 min",
            },
            {
              icon: "hub",
              bg: "bg-orange-50",
              color: "text-orange-500",
              title: "CRM HubSpot sync",
              desc: "Synchronise tes clients Novakou vers HubSpot avec tags automatiques par produit.",
              level: "Avancé",
              levelColor: "bg-red-50 text-red-600",
              time: "30 min",
            },
            {
              icon: "analytics",
              bg: "bg-blue-50",
              color: "text-blue-600",
              title: "Analytics mensuel",
              desc: "Récupère tes KPIs via /analytics et exporte-les vers Google Data Studio.",
              level: "Intermédiaire",
              levelColor: "bg-amber-50 text-amber-700",
              time: "20 min",
            },
            {
              icon: "bolt",
              bg: "bg-yellow-50",
              color: "text-yellow-600",
              title: "Intégration Zapier",
              desc: "Connecte Novakou à 5000+ apps (Airtable, Notion, Slack) sans coder.",
              level: "Débutant",
              levelColor: "bg-[#006e2f]/10 text-[#006e2f]",
              time: "5 min",
            },
          ].map((g) => (
            <div
              key={g.title}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#006e2f]/20 transition-all cursor-pointer flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${g.bg}`}>
                  <span className={`material-symbols-outlined text-[22px] ${g.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{g.icon}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${g.levelColor}`}>{g.level}</span>
              </div>
              <h3 className="font-extrabold text-[#191c1e] text-base mb-1">{g.title}</h3>
              <p className="text-[12px] text-[#5c647a] leading-snug flex-1">{g.desc}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#5c647a]">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {g.time}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006e2f] group-hover:translate-x-0.5 transition-transform">
                  Voir le guide
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ FAQ développeur ═════════ */}
      <section id="faq" className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">Questions fréquentes</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mt-1">FAQ développeur</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {[
            {
              q: "Comment générer une clé API ?",
              a: "Rends-toi dans ton dashboard Novakou → Clés API → bouton « Nouvelle clé ». Choisis les scopes nécessaires, la date d'expiration, et copie la clé immédiatement — elle ne sera plus affichée après.",
            },
            {
              q: "Quelle est la différence entre clés test et live ?",
              a: "Les clés live (préfixe nk_live_) accèdent à tes vraies données. Les clés test (nk_test_) retournent des données fictives pour tes intégrations en développement. Tu peux générer autant de clés de chaque type que nécessaire.",
            },
            {
              q: "Comment gérer les erreurs 429 (rate limit) ?",
              a: "L'API retourne un header Retry-After indiquant le délai d'attente avant la prochaine requête. Implémente un backoff exponentiel : attends la durée indiquée, puis réessaye en doublant le délai si l'erreur persiste.",
            },
            {
              q: "Les webhooks peuvent-ils être retentés ?",
              a: "Oui. En cas d'échec (code HTTP ≠ 2xx), Novakou retente la livraison selon un backoff exponentiel : 30s, 2min, 10min, 1h, 6h. Après 5 tentatives infructueuses, le webhook est marqué comme failed et visible dans ton dashboard.",
            },
            {
              q: "Comment tester mes intégrations en local ?",
              a: "Utilise des outils comme ngrok ou Cloudflare Tunnel pour exposer ton serveur local à Internet. Configure l'URL ngrok comme endpoint webhook dans ton dashboard Novakou, puis déclenche des événements en mode test.",
            },
            {
              q: "Quelle est la politique de versioning de l'API ?",
              a: "L'API Novakou est versionnée via le path (/api/v1/...). Toute breaking change introduira une nouvelle version (/api/v2/...). La version précédente reste supportée 12 mois minimum après la sortie de la nouvelle.",
            },
            {
              q: "Puis-je utiliser OAuth au lieu d'API keys ?",
              a: "OAuth 2.0 arrive en Q3 2026. Pour l'instant, seules les clés API sont disponibles. Tu peux créer plusieurs clés avec des scopes différents pour séparer les contextes (prod, staging, différents services).",
            },
            {
              q: "Comment signaler un bug ou proposer une fonctionnalité ?",
              a: "Ouvre un ticket sur github.com/novakou/api/issues ou écris-nous à dev@novakou.com. Pour les bugs critiques (fuites de données, incidents sécurité), contacte-nous directement à security@novakou.com.",
            },
          ].map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-semibold text-[#191c1e] text-sm pr-4">{f.q}</span>
                <span
                  className={`material-symbols-outlined text-[20px] text-[#5c647a] transition-transform flex-shrink-0 ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-[#5c647a] leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ Besoin d'aide ═════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white"
          style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold">Besoin d&apos;aide ? Notre équipe est là.</h3>
              <p className="text-white/80 mt-2 max-w-xl text-sm">
                Intégration bloquée ? Documentation ambiguë ? Contacte-nous, on répond sous 24h ouvrées.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:dev@novakou.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#006e2f] text-sm font-bold hover:bg-white/90"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Email support
              </a>
              <a
                href="https://discord.gg/novakou"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-[18px]">forum</span>
                Discord communauté
              </a>
              <a
                href="https://status.novakou.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
                Status page
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ Footer CTA ═════════ */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-center">
          <h3 className="text-2xl font-extrabold text-[#191c1e]">Prêt à intégrer ?</h3>
          <p className="text-[#5c647a] mt-2">Générez votre clé API et commencez à builder.</p>
          <Link
            href="/vendeur/api-keys"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            Créer ma clé API Novakou
          </Link>
          <p className="text-[11px] text-[#5c647a] mt-8">
            © 2026 Novakou — La plateforme qui élève votre carrière freelance
          </p>
        </div>
      </section>
    </div>
  );
}
