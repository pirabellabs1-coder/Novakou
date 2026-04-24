"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Attempt = {
  id: string;
  status: "STARTED" | "ABANDONED" | "FAILED" | "COMPLETED" | "RECOVERED";
  visitorEmail: string | null;
  visitorName: string | null;
  visitorPhone: string | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  failureReason: string | null;
  failureCode: string | null;
  providerRef: string | null;
  reminder1SentAt: string | null;
  reminder2SentAt: string | null;
  vendorContactedAt: string | null;
  recoveredAt: string | null;
  createdAt: string;
  formation: { id: string; title: string; slug: string; price: number } | null;
  product: { id: string; title: string; slug: string; price: number } | null;
};

type StatusFilter = "unresolved" | "failed" | "abandoned" | "recovered" | "all";

const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

function statusLabel(s: Attempt["status"]) {
  const map: Record<Attempt["status"], { label: string; color: string; bg: string }> = {
    STARTED: { label: "Démarré", color: "text-blue-700", bg: "bg-blue-50" },
    ABANDONED: { label: "Abandonné", color: "text-amber-700", bg: "bg-amber-50" },
    FAILED: { label: "Échoué", color: "text-rose-700", bg: "bg-rose-50" },
    COMPLETED: { label: "Payé", color: "text-emerald-700", bg: "bg-emerald-50" },
    RECOVERED: { label: "Récupéré", color: "text-emerald-700", bg: "bg-emerald-50" },
  };
  return map[s];
}

function waLink(phone: string, message: string): string {
  const clean = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function AbandonsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<Record<string, { count: number; amount: number }>>({});
  const [status, setStatus] = useState<StatusFilter>("unresolved");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/vendeur/checkout-attempts?status=${status}`);
      const json = await res.json();
      setAttempts(json.data ?? []);
      setStats(json.stats ?? {});
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  async function markContacted(id: string) {
    await fetch("/api/formations/vendeur/checkout-attempts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "mark_contacted" }),
    });
    load();
  }

  const totalLost = (stats.FAILED?.amount ?? 0) + (stats.ABANDONED?.amount ?? 0);
  const totalRecovered = stats.RECOVERED?.amount ?? 0;
  const totalCompleted = stats.COMPLETED?.amount ?? 0;

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
          <Link href="/vendeur/dashboard" className="hover:text-[#006e2f]">Tableau de bord</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium">Abandons & Échecs</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Abandons & Paiements échoués</h1>
            <p className="text-sm text-[#5c647a]">Relancez les visiteurs qui ont tenté d&apos;acheter mais n&apos;ont pas finalisé</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Potentiel perdu" value={fmtFCFA(totalLost)} sub={`${(stats.FAILED?.count ?? 0) + (stats.ABANDONED?.count ?? 0)} tentatives`} color="rose" />
        <StatCard label="Récupéré" value={fmtFCFA(totalRecovered)} sub={`${stats.RECOVERED?.count ?? 0} récupérations`} color="emerald" />
        <StatCard label="Paiements réussis" value={fmtFCFA(totalCompleted)} sub={`${stats.COMPLETED?.count ?? 0} commandes`} color="blue" />
        <StatCard
          label="Taux conversion"
          value={`${stats.COMPLETED?.count ? Math.round((stats.COMPLETED.count / ((stats.COMPLETED?.count ?? 0) + (stats.FAILED?.count ?? 0) + (stats.ABANDONED?.count ?? 0))) * 100) : 0}%`}
          sub="payés / total tentatives"
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-4 w-fit overflow-x-auto">
        {([
          { id: "unresolved", label: "À relancer" },
          { id: "failed", label: "Échecs" },
          { id: "abandoned", label: "Abandons" },
          { id: "recovered", label: "Récupérés" },
          { id: "all", label: "Tout" },
        ] as Array<{ id: StatusFilter; label: string }>).map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${
              status === t.id ? "bg-[#191c1e] text-white" : "text-[#5c647a] hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">celebration</span>
          <h3 className="text-lg font-bold text-[#191c1e] mt-3">Aucun abandon pour l&apos;instant</h3>
          <p className="text-sm text-[#5c647a] mt-1">
            Les visiteurs qui ne finalisent pas leurs achats apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const item = a.formation || a.product;
            const itemTitle = item?.title ?? "Produit supprimé";
            const itemType = a.formation ? "formation" : a.product ? "produit" : "inconnu";
            const visitorIdentity = a.visitorName || a.visitorEmail || "Visiteur anonyme";
            const st = statusLabel(a.status);
            const alreadyContacted = !!a.vendorContactedAt;
            const emailSubject = encodeURIComponent(`À propos de votre achat : ${itemTitle}`);
            const emailBody = encodeURIComponent(`Bonjour ${a.visitorName || ""},\n\nVous avez tenté d'acheter "${itemTitle}" sur notre boutique mais la transaction n'a pas abouti.\n\nJe voulais m'assurer que tout va bien et voir si je peux vous aider à finaliser votre achat.\n\nÀ bientôt,`);
            const waMessage = `Bonjour ${a.visitorName || ""}, vous avez tenté d'acheter "${itemTitle}" sur notre boutique. Je suis là si vous avez besoin d'aide pour finaliser votre achat.`;

            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#006e2f]/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                      {alreadyContacted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                          ✓ Contacté
                        </span>
                      )}
                      {a.reminder1SentAt && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          Rappel 1 envoyé
                        </span>
                      )}
                      {a.reminder2SentAt && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          Rappel 2 envoyé
                        </span>
                      )}
                      <span className="text-[10px] text-[#5c647a]">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-base font-bold text-[#191c1e]">{visitorIdentity}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5c647a] mt-0.5">
                      {a.visitorEmail && <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span>{a.visitorEmail}</span>}
                      {a.visitorPhone && <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">phone</span>{a.visitorPhone}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[#191c1e]">{fmtFCFA(a.amount)}</p>
                    <p className="text-[10px] text-[#5c647a]">{a.paymentMethod ?? "Moyen inconnu"}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs">
                  <p className="text-[#5c647a]">
                    <span className="font-bold">{itemType === "formation" ? "Formation" : "Produit"} :</span> {itemTitle}
                  </p>
                  {a.failureReason && (
                    <p className="text-rose-700 mt-1">
                      <span className="font-bold">Raison de l&apos;échec :</span> {a.failureReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {a.visitorEmail && (
                    <a
                      href={`mailto:${a.visitorEmail}?subject=${emailSubject}&body=${emailBody}`}
                      onClick={() => markContacted(a.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-[#006e2f] hover:bg-[#005523]"
                    >
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      Envoyer un email
                    </a>
                  )}
                  {a.visitorPhone && (
                    <a
                      href={waLink(a.visitorPhone, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markContacted(a.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      WhatsApp
                    </a>
                  )}
                  {!alreadyContacted && (a.visitorEmail || a.visitorPhone) && (
                    <button
                      onClick={() => markContacted(a.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#5c647a] text-xs font-bold border border-gray-200 hover:bg-gray-50"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Marquer comme contacté
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: "rose" | "emerald" | "blue" | "purple" }) {
  const bg = {
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  }[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${bg.split(" ")[1]}`}>{value}</p>
      <p className="text-[10px] text-[#5c647a] mt-1">{sub}</p>
    </div>
  );
}
