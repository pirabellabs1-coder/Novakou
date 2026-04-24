"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";

type Segment = "all" | "vendors" | "mentors" | "learners";

const SEGMENTS: { value: Segment; label: string; description: string; icon: string }[] = [
  { value: "all", label: "Tous les utilisateurs", description: "Vendeurs, mentors, apprenants, admins — tous les comptes actifs", icon: "public" },
  { value: "vendors", label: "Tous les vendeurs", description: "Utilisateurs ayant un profil instructeur (peuvent vendre des formations/produits)", icon: "storefront" },
  { value: "mentors", label: "Tous les mentors", description: "Utilisateurs ayant un profil mentor (séances 1-to-1)", icon: "support_agent" },
  { value: "learners", label: "Tous les apprenants", description: "Utilisateurs ayant acheté au moins une formation ou un produit", icon: "school" },
];

export default function NouvelleCampagnePage() {
  const router = useRouter();
  const toast = useToastStore.getState().addToast;

  const [subject, setSubject] = useState("");
  const [segment, setSegment] = useState<Segment>("vendors");
  const [htmlBody, setHtmlBody] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Récupère le count dynamique quand le segment change
  useEffect(() => {
    setLoadingCount(true);
    fetch(`/api/admin/campaigns/draft/preview?segment=${segment}`)
      .then((r) => r.json())
      .then((j) => setRecipientCount(j.data?.recipientCount ?? 0))
      .catch(() => setRecipientCount(0))
      .finally(() => setLoadingCount(false));
  }, [segment]);

  function validate(): string | null {
    if (subject.trim().length < 3) return "L'objet doit contenir au moins 3 caractères.";
    if (subject.trim().length > 200) return "L'objet ne peut dépasser 200 caractères.";
    if (htmlBody.replace(/<[^>]+>/g, "").trim().length < 10) return "Le contenu du mail doit contenir du texte.";
    return null;
  }

  async function saveDraft(): Promise<string | null> {
    const err = validate();
    if (err) { toast("warning", err); return null; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), htmlBody, segment }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error || "Erreur lors de la sauvegarde");
        return null;
      }
      setCampaignId(j.data.id);
      return j.data.id;
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    let id = campaignId;
    if (!id) {
      id = await saveDraft();
      if (!id) return;
    }
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error || "Envoi test échoué");
        return;
      }
      toast("success", `Email test envoyé à ${j.data.to}`);
    } catch {
      toast("error", "Erreur réseau");
    }
  }

  async function handleSend() {
    const ok = await confirmAction({
      title: `Envoyer à ${recipientCount ?? 0} destinataires ?`,
      message: `Vous allez envoyer "${subject}" à tous les ${SEGMENTS.find((s) => s.value === segment)?.label.toLowerCase()}. Cette action est irréversible.`,
      confirmLabel: "Envoyer maintenant",
      confirmVariant: "danger",
      icon: "send",
    });
    if (!ok) return;

    let id = campaignId;
    if (!id) {
      id = await saveDraft();
      if (!id) return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error || "Envoi échoué");
        setSending(false);
        return;
      }
      toast("success", `Campagne envoyée : ${j.data.sent}/${j.data.total} emails`);
      router.push("/admin/emails");
    } catch {
      toast("error", "Erreur lors de l'envoi");
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1200px] mx-auto">
        <Link
          href="/admin/emails"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-6"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Retour aux campagnes
        </Link>

        <header className="mb-10">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Communication
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
            Nouvelle campagne
          </h1>
        </header>

        <div className="space-y-6">
          {/* 1. Segment */}
          <section className="bg-white rounded-2xl border border-zinc-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">1</span>
              <h2 className="text-base font-extrabold text-zinc-900">Destinataires</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-4">Choisissez le groupe qui recevra cette campagne.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SEGMENTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSegment(s.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    segment === s.value
                      ? "border-[#006e2f] bg-emerald-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      segment === s.value ? "bg-[#006e2f] text-white" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${segment === s.value ? "text-[#006e2f]" : "text-zinc-900"}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>
                    </div>
                    {segment === s.value && (
                      <span className="material-symbols-outlined text-[#006e2f] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006e2f] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <p className="text-sm text-emerald-900 font-semibold">
                {loadingCount
                  ? "Calcul en cours…"
                  : `${(recipientCount ?? 0).toLocaleString("fr-FR")} destinataire${(recipientCount ?? 0) > 1 ? "s" : ""} recevront ce mail.`}
              </p>
            </div>
          </section>

          {/* 2. Objet */}
          <section className="bg-white rounded-2xl border border-zinc-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">2</span>
              <h2 className="text-base font-extrabold text-zinc-900">Objet de l&apos;email</h2>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : Nouvelles fonctionnalités pour les vendeurs Novakou"
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f]"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 tabular-nums">
              {subject.length}/200 caractères
            </p>
          </section>

          {/* 3. Contenu */}
          <section className="bg-white rounded-2xl border border-zinc-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">3</span>
              <h2 className="text-base font-extrabold text-zinc-900">Contenu du message</h2>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Utilisez l&apos;éditeur pour mettre en forme votre message.
              La signature <strong>« L&apos;équipe Novakou »</strong> est ajoutée automatiquement en bas.
            </p>
            <p className="text-[11px] text-zinc-500 mb-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              💡 <strong>Variables disponibles</strong> : <code className="bg-white px-1.5 py-0.5 rounded">{`{{prenom}}`}</code> sera remplacé par le prénom du destinataire.
            </p>
            <RichTextEditor
              value={htmlBody}
              onChange={setHtmlBody}
              placeholder="Bonjour {{prenom}}, nous avons le plaisir de vous annoncer..."
              minHeight={320}
            />
          </section>

          {/* 4. Actions */}
          <section className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-end">
            <button
              type="button"
              onClick={handleTest}
              disabled={saving || sending}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Envoyer un test à moi-même
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={saving || sending || !subject || !htmlBody || (recipientCount ?? 0) === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {sending ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Envoi en cours…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  Envoyer à {(recipientCount ?? 0).toLocaleString("fr-FR")} destinataire{(recipientCount ?? 0) > 1 ? "s" : ""}
                </>
              )}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
