"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type DocSection = "welcome" | "getting-started" | "changelog" | "api-keys" | "oauth" | "freelances" | "projets" | "paiements" | "webhooks" | "rate-limits" | "errors";

interface Endpoint {
  method: string;
  methodColor: string;
  path: string;
  description: string;
}

const ENDPOINTS: Endpoint[] = [
  { method: "GET", methodColor: "bg-green-900/30 text-green-400", path: "/v1/services", description: "Liste tous les services disponibles" },
  { method: "POST", methodColor: "bg-blue-900/30 text-blue-400", path: "/v1/orders", description: "Cree une nouvelle commande" },
  { method: "PUT", methodColor: "bg-yellow-900/30 text-yellow-400", path: "/v1/user/profile", description: "Met a jour les informations du profil" },
  { method: "DELETE", methodColor: "bg-red-900/30 text-red-400", path: "/v1/webhooks/:id", description: "Supprime un endpoint de webhook" },
];

const SIDEBAR_SECTIONS: { title: string; items: { key: DocSection; icon: string; label: string }[] }[] = [
  {
    title: "Introduction",
    items: [
      { key: "welcome", icon: "waving_hand", label: "Bienvenue" },
      { key: "getting-started", icon: "rocket_launch", label: "Guide de demarrage" },
      { key: "changelog", icon: "history", label: "Journal des modifications" },
    ],
  },
  {
    title: "Authentification",
    items: [
      { key: "api-keys", icon: "vpn_key", label: "Cles API" },
      { key: "oauth", icon: "lock_person", label: "Flux OAuth 2.0" },
    ],
  },
  {
    title: "Endpoints API",
    items: [
      { key: "freelances", icon: "person", label: "Freelances" },
      { key: "projets", icon: "work", label: "Projets" },
      { key: "paiements", icon: "account_balance_wallet", label: "Paiements" },
    ],
  },
  {
    title: "Ressources",
    items: [
      { key: "webhooks", icon: "webhook", label: "Webhooks" },
      { key: "rate-limits", icon: "speed", label: "Limites de debit" },
      { key: "errors", icon: "error_outline", label: "Codes d'erreur" },
    ],
  },
];

// ============================================================
// Page Component
// ============================================================

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("welcome");
  const [helpful, setHelpful] = useState<boolean | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 p-6 border-r border-border-dark shrink-0">
        <div className="sticky top-24 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
          <div className="space-y-8">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-4">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveSection(item.key)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-left transition-all",
                        activeSection === item.key
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-slate-400 hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <span className="material-symbols-outlined text-sm">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <Link href="/developer" className="hover:text-primary">
              Docs
            </Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-medium">Reference API</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold mb-4 text-white">
              Documentation API
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              Bienvenue sur la documentation officielle de l&apos;API FreelanceHigh. Intégrez
              les fonctionnalités de notre marketplace directement dans vos applications,
              automatisez vos processus de recrutement et gérez vos transactions en toute
              sécurité.
            </p>
          </header>

          {/* Content Sections */}
          <div className="space-y-16">
            {/* 1. Introduction */}
            <article>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  1
                </span>
                Introduction
              </h2>
              <div className="text-slate-400 space-y-4">
                <p>
                  L&apos;API FreelanceHigh est organisee autour de{" "}
                  <strong className="text-white">REST</strong>. Notre API dispose d&apos;URLs
                  previsibles axees sur les ressources, accepte les corps de requete encodes en
                  JSON, renvoie des reponses JSON et utilise les codes de reponse HTTP standard.
                </p>
                <p>
                  Vous pouvez utiliser l&apos;API en mode{" "}
                  <span className="px-2 py-0.5 bg-primary/20 rounded text-xs font-mono text-primary font-bold">
                    Test
                  </span>{" "}
                  pour vos developpements ou en mode{" "}
                  <span className="px-2 py-0.5 bg-green-900/30 rounded text-xs font-mono text-green-600 font-bold">
                    Live
                  </span>{" "}
                  pour vos transactions reelles.
                </p>
              </div>
            </article>

            {/* 2. Authentification */}
            <article>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  2
                </span>
                Authentification
              </h2>
              <p className="text-slate-400 mb-6">
                L&apos;API utilise des cles API pour authentifier les requetes. Vous pouvez
                consulter et gerer vos cles API dans le{" "}
                <Link href="/developer" className="text-primary hover:underline">
                  tableau de bord developpeur
                </Link>
                .
              </p>

              {/* Info box */}
              <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-blue-500">info</span>
                  <p className="text-sm text-blue-300">
                    Vos cles API portent des privileges importants. Veillez a les garder
                    secretes et ne les partagez jamais sur des plateformes publiques comme
                    GitHub.
                  </p>
                </div>
              </div>

              {/* Code block */}
              <div className="bg-[#0b140c] border border-primary/20 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="size-2.5 rounded-full bg-red-500/50" />
                    <div className="size-2.5 rounded-full bg-yellow-500/50" />
                    <div className="size-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Exemple de requete cURL
                  </span>
                  <button className="text-slate-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="text-sm font-mono text-slate-300">
                    <code>
                      <span className="text-primary">curl</span> -X GET
                      https://api.freelancehigh.com/v1/freelancers \{"\n"}
                      {"  "}-H{" "}
                      <span className="text-yellow-400">
                        &quot;Authorization: Bearer YOUR_API_KEY&quot;
                      </span>{" "}
                      \{"\n"}
                      {"  "}-H{" "}
                      <span className="text-yellow-400">
                        &quot;Content-Type: application/json&quot;
                      </span>
                    </code>
                  </pre>
                </div>
              </div>
            </article>

            {/* 3. Endpoints */}
            <article>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  3
                </span>
                Reference des Endpoints
              </h2>
              <div className="overflow-hidden border border-primary/10 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-primary/5 border-b border-primary/10">
                    <tr>
                      <th className="px-6 py-4 font-bold">Methode</th>
                      <th className="px-6 py-4 font-bold">Endpoint</th>
                      <th className="px-6 py-4 font-bold hidden md:table-cell">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {ENDPOINTS.map((ep) => (
                      <tr key={ep.path}>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded",
                              ep.methodColor
                            )}
                          >
                            {ep.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{ep.path}</td>
                        <td className="px-6 py-4 text-slate-500 hidden md:table-cell">
                          {ep.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            {/* Response Example */}
            <article>
              <h2 className="text-xl font-bold mb-6 text-slate-200">
                Exemple de Reponse
              </h2>
              <div className="bg-[#0b140c] border border-primary/20 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    JSON Response
                  </span>
                  <span className="text-[10px] font-mono text-green-500">200 OK</span>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="text-sm font-mono text-slate-300">
                    <code>
                      {`{
  `}
                      <span className="text-primary">&quot;id&quot;</span>
                      {`: `}
                      <span className="text-yellow-400">&quot;srv_507f1f77&quot;</span>
                      {`,
  `}
                      <span className="text-primary">&quot;title&quot;</span>
                      {`: `}
                      <span className="text-yellow-400">
                        &quot;Design Logo Minimaliste&quot;
                      </span>
                      {`,
  `}
                      <span className="text-primary">&quot;price&quot;</span>
                      {`: `}
                      <span className="text-yellow-400">25000</span>
                      {`,
  `}
                      <span className="text-primary">&quot;currency&quot;</span>
                      {`: `}
                      <span className="text-yellow-400">&quot;XOF&quot;</span>
                      {`,
  `}
                      <span className="text-primary">&quot;freelancer&quot;</span>
                      {`: {
    `}
                      <span className="text-primary">&quot;name&quot;</span>
                      {`: `}
                      <span className="text-yellow-400">&quot;Sarah D.&quot;</span>
                      {`,
    `}
                      <span className="text-primary">&quot;rating&quot;</span>
                      {`: `}
                      <span className="text-yellow-400">4.9</span>
                      {`
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </article>
          </div>

          {/* Footer feedback */}
          <div className="mt-20 pt-10 border-t border-primary/10 flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-sm font-bold text-slate-300 mb-2">
                Cette page vous a-t-elle aide ?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setHelpful(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm",
                    helpful === true
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/20 hover:bg-primary/10"
                  )}
                >
                  <span className="material-symbols-outlined text-sm">thumb_up</span> Oui
                </button>
                <button
                  onClick={() => setHelpful(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm",
                    helpful === false
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-primary/20 hover:bg-primary/10"
                  )}
                >
                  <span className="material-symbols-outlined text-sm">thumb_down</span> Non
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                Dernière mise à jour le 15 Octobre 2025
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
