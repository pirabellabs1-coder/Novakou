"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  subject: string;
  segment: string;
  segmentLabel: string;
  status: "draft" | "sending" | "sent" | "failed";
  sentAt: string | null;
  recipientCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sending: "En cours d'envoi",
  sent: "Envoyée",
  failed: "Échec",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  sending: "bg-blue-100 text-blue-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
};

export default function AdminEmailsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/campaigns")
      .then((r) => r.json())
      .then((j) => setCampaigns(Array.isArray(j.data) ? j.data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
              Communication
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">Campagnes email</h1>
            <p className="text-sm text-zinc-500 mt-2 max-w-xl">
              Envoyez des annonces, conseils ou offres à vos vendeurs, mentors
              ou apprenants. Éditeur riche · Signature automatique · Tests avant envoi.
            </p>
          </div>
          <Link
            href="/admin/emails/nouveau"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouvelle campagne
          </Link>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-300">mail</span>
            <h3 className="text-lg font-bold text-zinc-900 mt-4">Aucune campagne pour l&apos;instant</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              Envoyez votre première campagne pour communiquer avec vos vendeurs ou apprenants.
            </p>
            <Link
              href="/admin/emails/nouveau"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Créer ma première campagne
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#f9f9f9] border-b border-zinc-100">
                <tr>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objet</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Segment</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Envoyés</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Échecs</th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Statut</th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() => { window.location.href = `/admin/emails/${c.id}`; }}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-zinc-900 truncate max-w-[320px] hover:text-[#006e2f]">{c.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-600">{c.segmentLabel}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-700 tabular-nums">
                      {c.status === "sent" || c.status === "sending" ? (c.recipientCount - c.failedCount).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-zinc-500 tabular-nums">
                      {c.failedCount > 0 ? c.failedCount : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[c.status]}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-zinc-500 tabular-nums">
                      {c.sentAt
                        ? new Date(c.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })
                        : new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
