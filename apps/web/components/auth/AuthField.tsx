"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { CircleAlert, Eye, EyeOff, type LucideIcon } from "lucide-react";

export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: React.ReactNode;
  icone?: LucideIcon;
  /** Message d'erreur propre au champ, relié par aria-describedby. */
  erreur?: string | null;
  aide?: string;
  /** Élément à droite du label (« Mot de passe oublié ? »). */
  aside?: React.ReactNode;
  /** Bouton ou icône superposé à droite du champ. */
  trailing?: React.ReactNode;
  requis?: boolean;
  /** Délai d'entrée en ms (cascade des champs). Absent = pas d'entrée CSS
   *  (champ monté après une interaction, animé par useAnimerBascule). */
  delai?: number;
  /** Identifiants supplémentaires à relier (erreur globale du formulaire…). */
  describedBy?: string;
}

/** Champ étiqueté : label au-dessus, icône, focus vert, erreur inline. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, icone: Icone, erreur, aide, aside, trailing, requis, delai, describedBy, className = "", ...input },
  ref,
) {
  const idErreur = `${id}-erreur`;
  const idAide = `${id}-aide`;
  const described = [erreur ? idErreur : null, aide ? idAide : null, describedBy ?? null].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className="nkauth-field"
      data-reveal={delai !== undefined ? "" : undefined}
      style={delai !== undefined ? ({ "--d": delai } as React.CSSProperties) : undefined}
    >
      <label htmlFor={id} className="nkauth-label">
        <span>
          {label}
          {requis && (
            <span className="req" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {aside && <span className="nkauth-label-aside">{aside}</span>}
      </label>
      <div className="nkauth-control">
        {Icone && <Icone className="ico" aria-hidden="true" />}
        <input
          {...input}
          ref={ref}
          id={id}
          aria-invalid={erreur ? true : input["aria-invalid"]}
          aria-describedby={described}
          aria-required={requis || undefined}
          required={requis || input.required}
          className={`nkauth-input${Icone ? " has-ico" : ""}${trailing ? " has-trail" : ""} ${className}`}
        />
        {trailing}
      </div>
      {erreur && (
        <p id={idErreur} className="nkauth-error">
          <CircleAlert aria-hidden="true" />
          {erreur}
        </p>
      )}
      {aide && !erreur && (
        <p id={idAide} className="nkauth-hint">
          {aide}
        </p>
      )}
    </div>
  );
});

type PasswordFieldProps = Omit<AuthFieldProps, "type" | "trailing">;

/** Champ mot de passe avec bascule afficher/masquer (bouton réel, nommé). */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthField
      ref={ref}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          className="nkauth-trail"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      }
      {...props}
    />
  );
});
