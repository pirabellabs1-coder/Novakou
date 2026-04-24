"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { confirmAction } from "@/store/confirm";

interface Recipient {
  id: string;
  email: string;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  resendId: string | null;
}

interface Campaign {
  id: string;
  subject: string;
  htmlBody: string;
  segment: string;
  segmentLabel: string;
  status: "draft" | "sending" | "sent" | "failed";
  sentAt: string | null;
  recipientCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  createdAt: string;
  recipients: Recipient[];
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  sending: "bg-blue-100 text-blue-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sending: "En cours",
  sent: "Envoyée",
  failed: "Échec",
};

const RECIPIENT_STATUS_COLOR: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  bounced: "bg-amber-50 text-amber-700",
};
const RECIPIENT_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  sent: "Envoyé",
  failed: "Échec",
  bounced: "Rebond",
};

export default function AdminCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${params.id}`);
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Erreur");
        return;
      }
      setCampaign(j.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDelete() {
    const ok = await confirmAction({
      title: "Supprimer ce brouillon ?",
      message: "Cette action est irréversible.",
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (!ok) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/campaigns/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/emails");
      } else {
        const j = await res.json();
        alert(j.error || "Erreur");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      alert("Email invalide");
      return;
    }
    setBusy("test");
    try {
      const res = await fetch(`/api/admin/campaigns/${params.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail.trim() }),
      });
      const j = await res.json();
      if (res.ok) {
        alert(`Email de test envoyé à ${testEmail}`);
      } else {
        alert(j.error || "Erreur");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleSend() {
    const ok = await confirmAction({
      title: "Envoyer la campagne ?",
      message: `Cette action enverra l'email à tous les destinataires du segment "${campaign?.segmentLabel}". Cette action est irréversible.`,
      confirmLabel: "Envoyer",
      confirmVariant: "default",
      icon: "send",
    });
    if (!ok) return;
    setBusy("send");
    try {
      const res = await fetch(`/api/admin/campaigns/${params.id}/send`, { method: "POST" });
      const j = await res.json();
      if (res.ok) {
        alert(`Envoi lancé : ${j.data?.sent ?? 0} envoyés, ${j.data?.failed ?? 0} échecs`);
        load();
      } else {
        alert(j.error || "Erreur");
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-8 w-64 bg-zinc-200 rounded animate-pulse" />
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-rose-600">{error || "Campagne introuvable"}</p>
          <Link href="/admin/emails" className="text-sm text-zinc-600 hover:text-zinc-900 mt-4 inline-block">
            ← Retour aux campagnes
          </Link>
        </div>
      </div>
    );
  }

  const isDraft = campaign.status === "draft";
  const isSent = campaign.status === "sent" || campaign.status === "sending";
  const successCount = Math.max(0, campaign.recipientCount - campaign.failedCount);
  const openRate = campaign.recipientCount > 0
    ? Math.round((campaign.openedCount / campaign.recipientCount) * 100)
    : 0;
  const clickRate = campaign.recipientCount > 0
    ? Math.round((campaign.clickedCount / campaign.recipientCount) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-6xl mx-auto">
        <Link
          href="/admin/emails"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-6"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Retour aux campagnes
        </Link>

        <header className="mb-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[campaign.status]}`}>
                {STATUS_LABEL[campaign.status]}
              </span>
              <span className="text-xs text-zinc-500">· Segment : {campaign.segmentLabel}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 break-words">
              {campaign.subject}
            </h1>
            <p className="text-xs text-zinc-500 mt-2">
              Créée le {new Date(campaign.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {campaign.sentAt && ` · Envoyée le ${new Date(campaign.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {isDraft && (
              <>
                <button
                  onClick={handleSend}
                  disabled={!!busy}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#006e2f] to-[#22c55e] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Envoyer maintenant
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!!busy}
                  className="px-4 py-2.5 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Envoyés</p>
            <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">{successCount.toLocaleString("fr-FR")}</p>
            <p className="text-[10px] text-zinc-400 mt-1">sur {campaign.recipientCount.toLocaleString("fr-FR")} destinataires</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Échecs</p>
            <p className="text-2xl font-extrabold text-rose-600 tabular-nums">{campaign.failedCount.toLocaleString("fr-FR")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Ouvertures</p>
            <p className="text-2xl font-extrabold text-blue-600 tabular-nums">{openRate}%</p>
            <p className="text-[10px] text-zinc-400 mt-1">{campaign.openedCount.toLocaleString("fr-FR")} ouverts</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Clics</p>
            <p className="text-2xl font-extrabold text-purple-600 tabular-nums">{clickRate}%</p>
            <p className="text-[10px] text-zinc-400 mt-1">{campaign.clickedCount.toLocaleString("fr-FR")} clics</p>
          </div>
        </div>

        {/* Test email */}
        {isDraft && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 mb-8">
            <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#006e2f]">science</span>
              Envoyer un test
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Envoyez-vous la campagne pour vérifier le rendu avant l&apos;envoi final.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="votre@email.com"
                className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:border-[#22c55e] outline-none"
              />
              <button
                onClick={handleSendTest}
                disabled={!!busy}
                className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {busy === "test" ? "Envoi…" : "Tester"}
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 mb-8">
          <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#006e2f]">mail</span>
            Aperçu du contenu
          </h3>
          <div className="border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50">
            <iframe
              srcDoc={campaign.htmlBody}
              className="w-full h-[600px] border-0"
              sandbox="allow-same-origin"
              title="Aperçu campagne"
            />
          </div>
        </div>

        {/* Recipients list (si envoyée) */}
        {isSent && campaign.recipients.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#006e2f]">list</span>
                Destinataires récents ({campaign.recipients.length})
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Statut</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Envoyé</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ouvert</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cliqué</th>
                </tr>
              </thead>
              <tbody>
                {campaign.recipients.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm font-semibold text-zinc-900 truncate max-w-[260px]">{r.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${RECIPIENT_STATUS_COLOR[r.status]}`}>
                        {RECIPIENT_STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-zinc-500 tabular-nums">
                      {r.sentAt ? new Date(r.sentAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-zinc-500 tabular-nums">
                      {r.openedAt ? new Date(r.openedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-zinc-500 tabular-nums">
                      {r.clickedAt ? new Date(r.clickedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
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
