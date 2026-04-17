"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ConfigData = {
  configs: { id: string; key: string; value: string; label: string | null }[];
  values: Record<string, string>;
};

const CONFIG_SECTIONS = [
  {
    title: "Commission plateforme",
    eyebrow: "Financial",
    items: [
      { key: "commission_rate", label: "Taux de commission (%)", hint: "Par défaut 5%", type: "number" as const, default: "5" },
      { key: "min_payout_amount", label: "Seuil de retrait minimum", hint: "FCFA — minimum pour une demande", type: "number" as const, default: "10000" },
    ],
  },
  {
    title: "Remboursements",
    eyebrow: "Refund Policy",
    items: [
      { key: "refund_window_days", label: "Fenêtre de remboursement (jours)", hint: "Après cette période, remboursement refusé", type: "number" as const, default: "14" },
      { key: "auto_approve_refunds", label: "Approbation automatique", hint: "Approuver automatiquement les demandes", type: "toggle" as const, default: "false" },
    ],
  },
  {
    title: "Publication de produits",
    eyebrow: "Content Policy",
    items: [
      { key: "require_approval", label: "Validation obligatoire", hint: "Sinon publication automatique", type: "toggle" as const, default: "true" },
      { key: "max_products_free_tier", label: "Max produits tier gratuit", hint: "Limite pour le plan gratuit", type: "number" as const, default: "3" },
    ],
  },
  {
    title: "Communication",
    eyebrow: "Contacts",
    items: [
      { key: "support_email", label: "Email support", hint: "Contact pour les apprenants", type: "text" as const, default: "support@freelancehigh.com" },
      { key: "admin_notifications_email", label: "Email notifications admin", hint: "Reçoit les alertes critiques", type: "text" as const, default: "admin@freelancehigh.com" },
    ],
  },
];

export default function AdminConfigurationPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: response, isLoading } = useQuery<{ data: ConfigData }>({
    queryKey: ["admin-configuration"],
    queryFn: () => fetch("/api/formations/admin/configuration").then((r) => r.json()),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (response?.data) {
      const merged: Record<string, string> = {};
      CONFIG_SECTIONS.forEach((s) =>
        s.items.forEach((i) => {
          merged[i.key] = response.data.values[i.key] ?? i.default;
        })
      );
      setValues(merged);
      setDirty(false);
    }
  }, [response]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetch("/api/formations/admin/configuration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: values }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-configuration"] });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function updateField(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1100px] mx-auto">
        <div className="flex items-start justify-between gap-6 mb-12 flex-wrap">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
              Platform Settings
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">Configuration</h1>
            <p className="text-sm text-zinc-500 mt-3">Paramètres globaux de la plateforme Formations</p>
          </div>
          <div className="flex items-center gap-4">
            {saved && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Enregistré
              </span>
            )}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!dirty || saveMutation.isPending}
              className="px-10 py-4 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-48 bg-white animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {CONFIG_SECTIONS.map((section) => (
              <div key={section.title} className="bg-white">
                <div className="px-8 py-6 border-b border-zinc-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1 block">
                    {section.eyebrow}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-900">{section.title}</h3>
                </div>
                <div className="divide-y divide-zinc-100">
                  {section.items.map((item) => (
                    <div key={item.key} className="px-8 py-6 flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-bold text-zinc-900 mb-1">{item.label}</label>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.hint}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {item.type === "toggle" ? (
                          <button
                            onClick={() => updateField(item.key, values[item.key] === "true" ? "false" : "true")}
                            className={`relative w-14 h-7 transition-colors ${
                              values[item.key] === "true" ? "bg-[#22c55e]" : "bg-zinc-200"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-6 h-6 bg-white shadow transition-all ${
                                values[item.key] === "true" ? "left-[1.8rem]" : "left-0.5"
                              }`}
                            />
                          </button>
                        ) : (
                          <input
                            type={item.type}
                            value={values[item.key] ?? ""}
                            onChange={(e) => updateField(item.key, e.target.value)}
                            className="w-56 bg-[#f3f3f4] border-none focus:ring-1 focus:ring-[#22c55e] py-3 px-4 text-sm tabular-nums font-bold text-zinc-900 outline-none transition-shadow text-right"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
