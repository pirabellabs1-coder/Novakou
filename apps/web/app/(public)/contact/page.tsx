"use client";

import { useState } from "react";
import Link from "next/link";

const QUICK_FAQ = [
  { q: "Comment contacter le support ?", a: "Envoyez un message via ce formulaire ou ecrivez-nous a support@freelancehigh.com." },
  { q: "Quel est le delai de reponse ?", a: "Nous repondons generalement sous 24 a 48 heures ouvrables." },
  { q: "J'ai un litige avec un freelance/client", a: "Ouvrez un litige depuis votre commande. Notre equipe interviendra rapidement." },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'envoi");
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Contactez-nous</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Une question, une suggestion ou un probleme ? Notre equipe est la pour vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-neutral-dark rounded-2xl border border-border-dark p-8">
            {success ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-emerald-400 mb-4 block">
                  check_circle
                </span>
                <h3 className="text-xl font-bold text-white mb-2">Message envoye !</h3>
                <p className="text-slate-400 mb-6">
                  Nous avons bien recu votre message et vous repondrons sous 24-48h.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-white mb-2">Envoyez-nous un message</h2>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Sujet</label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Selectionnez un sujet --</option>
                    <option value="general">Question generale</option>
                    <option value="technique">Probleme technique</option>
                    <option value="paiement">Paiement / Facturation</option>
                    <option value="litige">Litige</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none"
                    placeholder="Decrivez votre demande..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </form>
            )}
          </div>

          {/* Info + FAQ */}
          <div className="space-y-8">
            {/* Contact info */}
            <div className="bg-neutral-dark rounded-2xl border border-border-dark p-8">
              <h2 className="text-xl font-bold text-white mb-6">Informations de contact</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">email</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="text-white font-semibold">support@freelancehigh.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-400">schedule</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Horaires</p>
                    <p className="text-white font-semibold">Lun - Ven, 9h - 18h (GMT+1)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-400">chat</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Reseaux sociaux</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-slate-400 hover:text-white cursor-pointer text-sm">Twitter</span>
                      <span className="text-slate-400 hover:text-white cursor-pointer text-sm">LinkedIn</span>
                      <span className="text-slate-400 hover:text-white cursor-pointer text-sm">Facebook</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick FAQ */}
            <div className="bg-neutral-dark rounded-2xl border border-border-dark p-8">
              <h2 className="text-xl font-bold text-white mb-6">Questions rapides</h2>
              <div className="space-y-4">
                {QUICK_FAQ.map((faq) => (
                  <div key={faq.q}>
                    <p className="text-sm font-semibold text-white mb-1">{faq.q}</p>
                    <p className="text-sm text-slate-400">{faq.a}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/faq"
                className="inline-flex items-center gap-1 text-primary text-sm font-semibold mt-4 hover:underline"
              >
                Voir toutes les FAQ
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
