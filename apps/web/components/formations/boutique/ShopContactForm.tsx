"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertCircle, Send } from "lucide-react";

type Champs = { nom: string; email: string; message: string };
type Erreurs = Partial<Record<keyof Champs, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function valider(c: Champs): Erreurs {
  const e: Erreurs = {};
  if (!c.nom.trim()) e.nom = "Indiquez votre nom, pour que la boutique sache à qui répondre.";
  if (!c.email.trim()) e.email = "Indiquez votre adresse e-mail.";
  else if (!EMAIL.test(c.email.trim())) e.email = "Cette adresse e-mail ne semble pas valide (ex. nom@exemple.com).";
  if (c.message.trim().length < 10) e.message = "Décrivez votre demande en quelques mots (10 caractères minimum).";
  return e;
}

/**
 * Formulaire de contact de la page « Contact » d'une boutique.
 *
 * Il n'existe pas d'API de contact au niveau boutique (celle des questions
 * est rattachée à un produit) : le formulaire valide côté client puis ouvre
 * la messagerie du visiteur avec un e-mail prérempli vers l'adresse publique
 * de la boutique. Sans adresse publique, il n'est pas proposé.
 */
export function ShopContactForm({ email, shopName }: { email: string | null; shopName: string }) {
  const id = useId();
  const [champs, setChamps] = useState<Champs>({ nom: "", email: "", message: "" });
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [tente, setTente] = useState(false);
  const [statut, setStatut] = useState("");

  if (!email) return null;

  function maj<K extends keyof Champs>(k: K, v: string) {
    const suivant = { ...champs, [k]: v };
    setChamps(suivant);
    // Après une première tentative, l'erreur se corrige en direct.
    if (tente) setErreurs(valider(suivant));
  }

  function envoyer(e: FormEvent) {
    e.preventDefault();
    setTente(true);
    const errs = valider(champs);
    setErreurs(errs);
    const premier = (Object.keys(errs) as Array<keyof Champs>)[0];
    if (premier) {
      document.getElementById(`${id}-${premier}`)?.focus();
      setStatut("");
      return;
    }
    const sujet = encodeURIComponent(`Message via la boutique ${shopName}`);
    const corps = encodeURIComponent(`${champs.message.trim()}\n\n— ${champs.nom.trim()} (${champs.email.trim()})`);
    setStatut("Votre messagerie s'ouvre avec le message prérempli. Il ne reste qu'à l'envoyer.");
    window.location.href = `mailto:${email}?subject=${sujet}&body=${corps}`;
  }

  const champ = (k: keyof Champs, label: string, aide?: string) => {
    const err = erreurs[k];
    const idChamp = `${id}-${k}`;
    const idErr = `${idChamp}-err`;
    const idAide = `${idChamp}-aide`;
    const decrit = [err ? idErr : null, aide ? idAide : null].filter(Boolean).join(" ") || undefined;
    const commun = {
      id: idChamp,
      name: k,
      className: "nkb-input",
      value: champs[k],
      required: true,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": decrit,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => maj(k, e.target.value),
    };
    return (
      <div className="nkb-field">
        <label htmlFor={idChamp} className="nkb-label">
          {label}
        </label>
        {k === "message" ? (
          <textarea {...commun} rows={5} />
        ) : (
          <input {...commun} type={k === "email" ? "email" : "text"} autoComplete={k === "email" ? "email" : "name"} />
        )}
        {aide && !err && (
          <span id={idAide} className="nkb-help">
            {aide}
          </span>
        )}
        {err && (
          <span id={idErr} className="nkb-error" role="alert">
            <AlertCircle strokeWidth={2} aria-hidden="true" />
            {err}
          </span>
        )}
      </div>
    );
  };

  return (
    <form className="nkb-form" onSubmit={envoyer} noValidate aria-labelledby={`${id}-titre`}>
      <h2 id={`${id}-titre`}>Nous écrire</h2>
      <p className="nkb-form__hint">Tous les champs sont requis. Réponse par e-mail, à l&apos;adresse que vous indiquez.</p>
      <div className="nkb-field--2">
        {champ("nom", "Votre nom")}
        {champ("email", "Votre e-mail", "Nous ne l'utilisons que pour vous répondre.")}
      </div>
      {champ("message", "Votre message")}
      <div className="nkb-form__foot">
        <button type="submit" className="nkb-btn nkb-btn--primary nkb-btn--lg">
          Envoyer le message
          <span className="nkb-btn__ico" aria-hidden="true">
            <Send strokeWidth={2} />
          </span>
        </button>
        <p className="nkb-form__status" role="status" aria-live="polite">
          {statut}
        </p>
      </div>
    </form>
  );
}
