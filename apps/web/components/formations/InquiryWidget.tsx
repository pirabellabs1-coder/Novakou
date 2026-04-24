"use client";

import { useState } from "react";

interface Props {
  formationId?: string;
  productId?: string;
  productTitle: string;
  vendorName?: string | null;
}

/**
 * Widget "Une question ?" a inserer sur les pages produit/formation.
 * Affiche un bouton discret ; au clic, ouvre une modale ou le visiteur
 * entre nom + email + message. Envoie a /api/formations/public/inquiries.
 *
 * Le vendeur recoit immediatement un email + notif in-app.
 */
export function InquiryWidget({ formationId, productId, productTitle, vendorName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name || !email || !subject || !message) {
      setError("Tous les champs sont requis");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/formations/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationId, productId,
          visitorName: name.trim(),
          visitorEmail: email.trim(),
          visitorPhone: phone.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
      }, 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#006e2f]/20 text-[#006e2f] font-bold text-sm hover:border-[#006e2f]/40 hover:bg-[#006e2f]/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">chat</span>
        Une question ? Contactez {vendorName ? vendorName.split(" ")[0] : "le vendeur"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-[#006e2f]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#006e2f] text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#191c1e] mb-2">Question envoyée !</h3>
                <p className="text-sm text-[#5c647a]">
                  {vendorName ?? "Le vendeur"} va vous répondre par email à <strong>{email}</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="text-xl font-extrabold text-[#191c1e]">Posez votre question</h3>
                  <p className="text-xs text-[#5c647a] mt-1">
                    Sur <strong>« {productTitle} »</strong>. Le vendeur répond par email.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom"
                      className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Téléphone (optionnel)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sujet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Votre question en détail…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />

                  {error && (
                    <div className="px-3 py-2 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={submit}
                      disabled={submitting || !name || !email || !subject || !message}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                    >
                      {submitting ? "Envoi…" : "Envoyer"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
