"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================
// Types & Demo Data
// ============================================================

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
}

interface ApiCall {
  id: string;
  status: number;
  statusText: string;
  method: string;
  endpoint: string;
  source: string;
  timeAgo: string;
  latency: string;
}

const DEMO_KEYS: ApiKey[] = [];

const DEMO_CALLS: ApiCall[] = [];

type SideTab = "keys" | "webhooks" | "logs" | "docs" | "stats";

// ============================================================
// Page Component
// ============================================================

export default function DeveloperPage() {
  const [keys, setKeys] = useState(DEMO_KEYS);
  const [sideTab, setSideTab] = useState<SideTab>("keys");
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(key: string) {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleRevoke(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function handleGenerate() {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: "Nouvelle cle",
      key: `af_live_••••••••••••${Math.random().toString(36).slice(-4)}`,
      createdAt: new Date().toLocaleDateString("fr-FR"),
      lastUsed: "Jamais",
    };
    setKeys((prev) => [...prev, newKey]);
  }

  const sideItems: { key: SideTab; icon: string; label: string }[] = [
    { key: "keys", icon: "key", label: "Cles API" },
    { key: "webhooks", icon: "webhook", label: "Webhooks" },
    { key: "logs", icon: "list_alt", label: "Journaux d'appels" },
    { key: "docs", icon: "description", label: "Documentation" },
    { key: "stats", icon: "analytics", label: "Statistiques" },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 p-6 border-r border-border-dark shrink-0">
        <div className="sticky top-24">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">
            Menu Developpeur
          </h3>
          <nav className="space-y-1">
            {sideItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSideTab(item.key)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left transition-colors",
                  sideTab === item.key
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-primary/5"
                )}
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-10 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">info</span>
              Limite actuelle
            </h4>
            <div className="w-full bg-white/10 h-1.5 rounded-full mb-2">
              <div className="bg-primary h-full rounded-full" style={{ width: "45%" }} />
            </div>
            <p className="text-[10px] text-slate-500">4,500 / 10,000 requetes ce mois</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="flex-1 p-6 lg:p-10">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold mb-1">Gestion des Cles API et Webhooks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Configurez vos acces techniques pour integrer les services FreelanceHigh a vos
            applications.
          </p>
        </div>

        {/* API Keys Table */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">key</span>
              Cles d&apos;acces
            </h2>
            <button
              onClick={handleGenerate}
              className="bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Generer une nouvelle cle
            </button>
          </div>

          <div className="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-500 font-bold border-b border-primary/10">
                <tr>
                  <th className="px-6 py-4">Nom de la clé</th>
                  <th className="px-6 py-4">Clé API</th>
                  <th className="px-6 py-4 hidden md:table-cell">Dernière utilisation</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="px-6 py-4">
                      <span className="font-bold">{k.name}</span>
                      <p className="text-[10px] text-slate-400">Creee le {k.createdAt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-black/20 px-2 py-1 rounded text-primary font-mono text-xs">
                          {k.key}
                        </code>
                        <button
                          onClick={() => handleCopy(k.id)}
                          className="hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copied === k.id ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 hidden md:table-cell">
                      {k.lastUsed}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="text-red-500 hover:text-red-600 font-bold flex items-center gap-1 text-xs"
                      >
                        <span className="material-symbols-outlined text-sm text-red-500">
                          delete
                        </span>
                        Revoquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two columns: Quick Integration + Recent Calls */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Quick Integration */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                integration_instructions
              </span>
              Integration rapide
            </h2>
            <div className="space-y-4">
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                <h4 className="font-bold mb-3 flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-sm">
                    terminal
                  </span>
                  Authentification (cURL)
                </h4>
                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  curl https://api.freelancehigh.com/v1/services \
                  <br />
                  &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_API_KEY&quot;
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/developer/docs"
                  className="p-4 bg-primary/5 rounded-xl border border-primary/10 hover:border-primary/50 transition-all flex flex-col gap-2"
                >
                  <span className="material-symbols-outlined text-primary">api</span>
                  <span className="font-bold text-sm">Reference API</span>
                  <span className="text-xs text-slate-500">
                    Explorer les endpoints disponibles.
                  </span>
                </Link>
                <Link
                  href="/developer/docs"
                  className="p-4 bg-primary/5 rounded-xl border border-primary/10 hover:border-primary/50 transition-all flex flex-col gap-2"
                >
                  <span className="material-symbols-outlined text-primary">auto_stories</span>
                  <span className="font-bold text-sm">Guide SDK</span>
                  <span className="text-xs text-slate-500">
                    Integrez via Node.js ou Python.
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent API Calls */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Appels API recents
            </h2>
            <div className="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden">
              <div className="divide-y divide-primary/10">
                {DEMO_CALLS.map((call) => (
                  <div
                    key={call.id}
                    className="p-4 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded font-bold",
                          call.status === 200
                            ? "bg-green-900/30 text-green-600"
                            : "bg-red-900/30 text-red-600"
                        )}
                      >
                        {call.statusText}
                      </span>
                      <div>
                        <p className="font-bold">
                          {call.method} {call.endpoint}
                        </p>
                        <p className="text-slate-500">
                          {call.source} · {call.timeAgo}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-400">{call.latency}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 p-3 text-center">
                <button className="text-primary text-xs font-bold hover:underline">
                  Voir tous les journaux
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="mt-12 mb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">webhook</span>
              Endpoints Webhooks
            </h2>
            <button className="text-primary text-sm font-bold flex items-center gap-2 border border-primary/20 hover:bg-primary/10 px-4 py-2 rounded-lg transition-all">
              <span className="material-symbols-outlined text-sm">
                settings_input_component
              </span>
              Ajouter un endpoint
            </button>
          </div>

          <div className="bg-primary/5 p-8 rounded-xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center">
            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-4xl">sensors</span>
            </div>
            <h4 className="font-bold mb-2">Aucun webhook configure</h4>
            <p className="text-sm text-slate-500 max-w-sm">
              Recevez des notifications en temps reel pour les evenements comme les nouvelles
              commandes ou les messages.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
