"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save } from "lucide-react";
import { StCard, StPageHeader, StButton, ST } from "@/components/stitch";
import { WipeMenu } from "@/components/admin/WipeMenu";

type ConfigData = {
  configs: { id: string; key: string; value: string; label: string | null }[];
  values: Record<string, string>;
};

const CONFIG_SECTIONS = [
  {
    title: "Commission plateforme",
    eyebrow: "Financial",
    items: [
      { key: "commission_rate", label: "Taux de commission (%)", hint: "Par défaut 10%", type: "number" as const, default: "10" },
      { key: "min_payout_amount", label: "Seuil de retrait minimum", hint: "FCFA — minimum pour une demande", type: "number" as const, default: "10000" },
    ],
  },
  {
    title: "Remboursements",
    eyebrow: "Refund Policy",
    items: [
      { key: "refund_window_days", label: "Fenêtre de remboursement (jours)", hint: "Après cette période, remboursement refusé. 7 jours est le standard marché.", type: "number" as const, default: "7" },
      { key: "max_consumed_pct", label: "Plafond contenu consommé (%)", hint: "Au-delà de ce % de leçons terminées, remboursement refusé. Anti-abus.", type: "number" as const, default: "30" },
      { key: "max_refunds_per_buyer_30d", label: "Max remboursements / acheteur / 30j", hint: "Empêche un même acheteur d'enchaîner les remboursements", type: "number" as const, default: "1" },
      { key: "mentor_cancel_hours", label: "Préavis annulation séance mentor (heures)", hint: "Au-delà de cette heure avant la séance, remboursement refusé", type: "number" as const, default: "24" },
      { key: "auto_approve_refunds", label: "Approbation automatique", hint: "Approuver automatiquement si toutes les conditions sont remplies", type: "toggle" as const, default: "false" },
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
      { key: "support_email", label: "Email support", hint: "Contact pour les apprenants", type: "text" as const, default: "support@novakou.com" },
      { key: "admin_notifications_email", label: "Email notifications admin", hint: "Reçoit les alertes critiques", type: "text" as const, default: "admin@novakou.com" },
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
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1100px] mx-auto space-y-5">
        <StPageHeader
          title="Configuration"
          subtitle="Paramètres globaux de la plateforme Formations"
          actions={
            <>
              {saved && (
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: ST.green }}>
                  <CheckCircle2 size={15} />
                  Enregistré
                </span>
              )}
              <StButton
                variant="primary"
                icon={Save}
                onClick={() => saveMutation.mutate()}
                disabled={!dirty || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </StButton>
            </>
          }
        />

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-[18px] animate-pulse" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {CONFIG_SECTIONS.map((section) => (
              <StCard key={section.title} noPadding>
                <div className="px-6 py-5" style={{ borderBottom: `1px solid ${ST.divider}` }}>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1 block" style={{ color: ST.green }}>
                    {section.eyebrow}
                  </span>
                  <h3 className="text-[17px] font-extrabold tracking-tight" style={{ color: ST.text }}>{section.title}</h3>
                </div>
                <div>
                  {section.items.map((item, idx) => (
                    <div
                      key={item.key}
                      className="px-6 py-5 flex items-center justify-between gap-6"
                      style={idx > 0 ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-[13.5px] font-extrabold mb-1" style={{ color: ST.text }}>{item.label}</label>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ST.textMuted }}>{item.hint}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {item.type === "toggle" ? (
                          <button
                            onClick={() => updateField(item.key, values[item.key] === "true" ? "false" : "true")}
                            className="relative w-14 h-7 rounded-full transition-colors"
                            style={{ background: values[item.key] === "true" ? ST.greenBright : "#dde6e0" }}
                          >
                            <span
                              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${
                                values[item.key] === "true" ? "left-[1.8rem]" : "left-0.5"
                              }`}
                            />
                          </button>
                        ) : (
                          <input
                            type={item.type}
                            value={values[item.key] ?? ""}
                            onChange={(e) => updateField(item.key, e.target.value)}
                            className="w-56 rounded-[12px] py-3 px-4 text-[13.5px] tabular-nums font-extrabold outline-none transition-all text-right focus:outline-none"
                            style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </StCard>
            ))}

            {/* Zone maintenance — outil destructif déplacé hors du dashboard
                (il y était trop accessible). Réservé à la maintenance. */}
            <StCard noPadding>
              <div className="px-6 py-5" style={{ borderBottom: `1px solid ${ST.divider}` }}>
                <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1 block text-rose-600">
                  Zone dangereuse
                </span>
                <h3 className="text-[17px] font-extrabold tracking-tight" style={{ color: ST.text }}>
                  Maintenance
                </h3>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="block text-[13.5px] font-extrabold mb-1" style={{ color: ST.text }}>
                    Nettoyer la plateforme
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ST.textMuted }}>
                    Purge de données — irréversible, double confirmation
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <WipeMenu />
                </div>
              </div>
            </StCard>
          </div>
        )}
      </main>
    </div>
  );
}
