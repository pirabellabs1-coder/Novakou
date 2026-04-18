"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = [
  { value: "paiement", label: "Problème de paiement", icon: "payment" },
  { value: "technique", label: "Bug ou problème technique", icon: "build" },
  { value: "compte", label: "Compte et connexion", icon: "person" },
  { value: "vendeur", label: "Vendre / boutique", icon: "storefront" },
  { value: "mentor", label: "Mentorat / séances", icon: "support_agent" },
  { value: "apprenant", label: "Achat / formation", icon: "school" },
  { value: "rgpd", label: "Vie privée & données", icon: "shield" },
  { value: "autre", label: "Autre", icon: "help" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "autre",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          url: typeof window !== "undefined" ? window.location.href : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Erreur lors de l'envoi");
        setStatus("error");
        return;
      }
      setReference(j.reference ?? null);
      setStatus("success");
    } catch {
      setError("Erreur réseau — vérifiez votre connexion");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center px-5 py-10"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_read
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Message reçu 👍
          </h1>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Notre équipe support va examiner votre demande et vous répondre rapidement.
            Un email de confirmation vient d&apos;être envoyé à{" "}
            <strong>{form.email}</strong>.
          </p>
          {reference && (
            <div className="inline-block mt-5 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Référence ticket
              </p>
              <p className="text-xl font-extrabold text-emerald-700 font-mono">{reference}</p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              href="/aide"
              className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold"
            >
              Explorer le centre d&apos;aide
            </Link>
            <Link
              href="/"
              className="px-5 py-3 rounded-xl text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#003d1a] via-[#006e2f] to-[#22c55e]">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: "white" }}
        />
        <div className="relative max-w-5xl mx-auto px-5 md:px-8 py-12 md:py-16 text-center">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-200 mb-2">
            Support Novakou
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Nous contacter
          </h1>
          <p className="text-sm text-emerald-50 mt-2 max-w-2xl mx-auto">
            Notre équipe répond en moyenne en moins de 5 minutes en chat, et sous 24h par email.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Form */}
          <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Ouvrir un ticket</h2>
              <p className="text-xs text-slate-500 mt-1">
                Plus votre message est précis, plus vite nous pourrons vous aider.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Votre nom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={80}
                  required
                  placeholder="Nom Prénom"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="vous@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catégorie <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: c.value })}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-center transition-colors ${
                      form.category === c.value
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                    <span className="text-[10px] font-bold leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Objet <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={120}
                required
                placeholder="Résumé en une phrase"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Votre message <span className="text-rose-500">*</span>
                <span className="font-normal text-slate-400 ml-1">({form.message.length}/5000)</span>
              </label>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 5000) })}
                required
                minLength={15}
                placeholder="Expliquez votre problème avec un maximum de détails : URL, captures d'écran (à joindre en répondant à l'email de confirmation), numéro de commande, navigateur, étapes pour reproduire…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                {status === "loading" ? "Envoi…" : "Envoyer le message"}
              </button>
              <p className="text-[11px] text-slate-500">
                En envoyant, vous acceptez nos{" "}
                <Link href="/cgu" className="underline">CGU</Link> et{" "}
                <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
              </p>
            </div>
          </form>

          {/* Sidebar — Contact direct */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Autres moyens de nous joindre</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px] flex-shrink-0">
                    mail
                  </span>
                  <div>
                    <a
                      href="mailto:support@novakou.com"
                      className="font-bold text-slate-900 hover:text-emerald-700"
                    >
                      support@novakou.com
                    </a>
                    <p className="text-[11px] text-slate-500">Réponse sous 24h ouvrées</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px] flex-shrink-0">
                    priority_high
                  </span>
                  <div>
                    <a
                      href="mailto:paiements@novakou.com"
                      className="font-bold text-slate-900 hover:text-emerald-700"
                    >
                      paiements@novakou.com
                    </a>
                    <p className="text-[11px] text-slate-500">Urgences paiement, réponse sous 2h</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px] flex-shrink-0">
                    shield
                  </span>
                  <div>
                    <a
                      href="mailto:privacy@novakou.com"
                      className="font-bold text-slate-900 hover:text-emerald-700"
                    >
                      privacy@novakou.com
                    </a>
                    <p className="text-[11px] text-slate-500">RGPD, export/suppression de données</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Avant de nous contacter</h3>
              <p className="text-xs text-slate-500 mb-3">
                La plupart des questions trouvent une réponse immédiate dans le centre d&apos;aide.
              </p>
              <Link
                href="/aide"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                <span className="material-symbols-outlined text-[14px]">menu_book</span>
                Consulter le centre d&apos;aide →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold mb-1">Horaires</h3>
              <p className="text-xs text-slate-300">
                Lundi – Vendredi<br />
                8h00 – 19h00 (GMT / heure d&apos;Abidjan)
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
