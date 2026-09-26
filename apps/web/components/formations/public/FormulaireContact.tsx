"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { CreditCard, GraduationCap, Headset, HelpCircle, MailCheck, ShieldCheck, Store, User, Wrench, type LucideIcon } from "lucide-react";
import { BoutonVerre } from "./BoutonVerre";

const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "paiement", label: "Problème de paiement", icon: CreditCard },
  { value: "technique", label: "Bug ou problème technique", icon: Wrench },
  { value: "compte", label: "Compte et connexion", icon: User },
  { value: "vendeur", label: "Vendre / boutique", icon: Store },
  { value: "mentor", label: "Mentorat / séances", icon: Headset },
  { value: "apprenant", label: "Achat / formation", icon: GraduationCap },
  { value: "rgpd", label: "Vie privée & données", icon: ShieldCheck },
  { value: "autre", label: "Autre", icon: HelpCircle },
];

const MAX_MESSAGE = 5000;

type Statut = "idle" | "loading" | "success" | "error";

/**
 * Formulaire de contact → POST /api/support/ticket (même charge utile
 * qu'avant : name, email, category, subject, message, url). Labels réels,
 * aides et erreurs reliées par aria-describedby, catégorie en groupe de
 * boutons radio, états chargement / erreur / succès rendus sur place.
 */
export function FormulaireContact() {
  const id = useId();
  const [form, setForm] = useState({ name: "", email: "", category: "autre", subject: "", message: "" });
  const [statut, setStatut] = useState<Statut>("idle");
  const [erreur, setErreur] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setStatut("loading");
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, url: typeof window !== "undefined" ? window.location.href : null }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErreur(j.error || "Erreur lors de l'envoi");
        setStatut("error");
        return;
      }
      setReference(j.reference ?? null);
      setStatut("success");
    } catch {
      setErreur("Erreur réseau — vérifiez votre connexion");
      setStatut("error");
    }
  }

  if (statut === "success") {
    return (
      <div className="nkp-core nkp-core--pad text-center" role="status">
        <span className="nkp-ic mx-auto mb-4" aria-hidden="true">
          <MailCheck strokeWidth={1.75} />
        </span>
        <h2 className="!text-[1.4rem]">Message reçu</h2>
        <p className="nkp-card__desc mx-auto max-w-md">
          Notre équipe support va examiner votre demande et vous répondre rapidement. Un email de confirmation vient d'être envoyé à <strong className="text-[#0e1512]">{form.email}</strong>.
        </p>
        {reference && (
          <div className="mx-auto mt-5 inline-block rounded-xl bg-[#f0f6f2] px-5 py-3 shadow-[inset_0_0_0_1px_#dfede4]">
            <span className="block text-[.66rem] font-bold uppercase tracking-[.16em] text-[#5c6b62]">Référence ticket</span>
            <span className="nkp-sora block text-[1.2rem] font-bold text-[#006e2f] nkp-num">{reference}</span>
          </div>
        )}
        <div className="nkp-actions mt-7 !mb-0">
          <BoutonVerre href="/aide" fleche>
            Explorer le centre d'aide
          </BoutonVerre>
          <BoutonVerre href="/" variante="primary">
            Retour à l'accueil
          </BoutonVerre>
        </div>
      </div>
    );
  }

  const idErreur = `${id}-erreur`;
  return (
    <form onSubmit={envoyer} className="nkp-core nkp-core--pad flex flex-col gap-5" aria-describedby={erreur ? idErreur : undefined}>
      <div>
        <h2 className="!text-[1.35rem]">Ouvrir un ticket</h2>
        <p className="nkp-help mt-1">Plus votre message est précis, plus vite nous pourrons vous aider.</p>
      </div>

      <div className="nkp-grid-2 !gap-4">
        <div className="nkp-field">
          <label htmlFor={`${id}-nom`} className="nkp-label">
            Votre nom<span className="req" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-nom`}
            type="text"
            className="nkp-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={80}
            required
            autoComplete="name"
            placeholder="Nom Prénom"
          />
        </div>
        <div className="nkp-field">
          <label htmlFor={`${id}-email`} className="nkp-label">
            Email<span className="req" aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            className="nkp-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
            inputMode="email"
            placeholder="vous@email.com"
          />
        </div>
      </div>

      <fieldset className="nkp-field !gap-2 m-0 p-0 border-0 min-w-0">
        <legend className="nkp-label mb-1">
          Catégorie<span className="req" aria-hidden="true">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((c) => {
            const actif = form.category === c.value;
            return (
              <label
                key={c.value}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center text-[.72rem] font-semibold leading-tight transition-[box-shadow,background-color,color] duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#006e2f] ${
                  actif ? "bg-[#f0f6f2] text-[#006e2f] shadow-[inset_0_0_0_1.5px_#006e2f]" : "bg-white text-[#5c6b62] shadow-[inset_0_0_0_1px_rgba(14,21,18,.1)] hover:bg-[#fbfcfb]"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-categorie`}
                  value={c.value}
                  checked={actif}
                  onChange={() => setForm({ ...form, category: c.value })}
                  className="sr-only"
                />
                <c.icon size={20} strokeWidth={1.75} aria-hidden="true" />
                {c.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="nkp-field">
        <label htmlFor={`${id}-objet`} className="nkp-label">
          Objet<span className="req" aria-hidden="true">*</span>
        </label>
        <input
          id={`${id}-objet`}
          type="text"
          className="nkp-input"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          maxLength={120}
          required
          placeholder="Résumé en une phrase"
        />
      </div>

      <div className="nkp-field">
        <label htmlFor={`${id}-message`} className="nkp-label">
          Votre message<span className="req" aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${id}-message`}
          className="nkp-textarea"
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, MAX_MESSAGE) })}
          required
          minLength={15}
          aria-describedby={`${id}-message-aide`}
          placeholder="Expliquez votre problème avec un maximum de détails : URL, captures d'écran (à joindre en répondant à l'email de confirmation), numéro de commande, navigateur, étapes pour reproduire…"
        />
        <p id={`${id}-message-aide`} className="nkp-help nkp-num">
          15 caractères minimum · {form.message.length}/{MAX_MESSAGE}
        </p>
      </div>

      {erreur && (
        <p id={idErreur} className="nkp-error" role="alert">
          {erreur}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-3 shadow-[inset_0_1px_0_#e6ece8] sm:flex-row sm:items-center">
        <button type="submit" disabled={statut === "loading"} className="nkp-btn nkp-btn--primary" aria-busy={statut === "loading"}>
          {statut === "loading" ? "Envoi…" : "Envoyer le message"}
        </button>
        <p className="nkp-help">
          En envoyant, vous acceptez nos{" "}
          <Link href="/cgu" className="underline underline-offset-2">
            CGU
          </Link>{" "}
          et{" "}
          <Link href="/confidentialite" className="underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
