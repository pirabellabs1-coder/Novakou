"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/formations/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(j.error || "Erreur lors de l'envoi");
      }
      setStatus("success");
      setForm({ name: "", email: "", subject: "general", message: "" });
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Hero */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
            <span className="material-symbols-outlined text-white text-[16px]">mail</span>
            <span className="text-white text-xs font-semibold">Contact</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Parlez à l&apos;équipe Novakou
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Nous répondons à tous les messages sous 24h ouvrées.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info cards */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-white text-[20px]">mail</span>
            </div>
            <p className="text-xs font-semibold text-[#5c647a] mb-0.5">Email</p>
            <p className="text-sm font-bold text-[#191c1e]">support@novakou.com</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-white text-[20px]">schedule</span>
            </div>
            <p className="text-xs font-semibold text-[#5c647a] mb-0.5">Horaires</p>
            <p className="text-sm font-bold text-[#191c1e]">Lun – Ven · 9h – 18h</p>
            <p className="text-xs text-[#5c647a] mt-0.5">Heure d&apos;Afrique de l&apos;Ouest (GMT)</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-white text-[20px]">help_center</span>
            </div>
            <p className="text-xs font-semibold text-[#5c647a] mb-0.5">Centre d&apos;aide</p>
            <Link href="/aide" className="text-sm font-bold text-[#006e2f] hover:underline">
              Consulter les FAQs →
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          {status === "success" ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-green-500 text-5xl">check_circle</span>
              <h3 className="text-lg font-extrabold text-[#191c1e] mt-2">Message envoyé !</h3>
              <p className="text-sm text-[#5c647a] mt-1.5">
                Nous vous répondrons sous 24h ouvrées à l&apos;adresse fournie.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-extrabold text-[#191c1e] mb-1">Écrivez-nous</h2>
              <p className="text-sm text-[#5c647a] mb-4">Décrivez votre besoin en détail.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Votre nom</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Sujet</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white"
                >
                  <option value="general">Question générale</option>
                  <option value="payment">Problème de paiement</option>
                  <option value="account">Mon compte</option>
                  <option value="vendor">Devenir vendeur / instructeur</option>
                  <option value="mentor">Devenir mentor</option>
                  <option value="affiliate">Programme d&apos;affiliation</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {status === "loading" ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Envoi…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
