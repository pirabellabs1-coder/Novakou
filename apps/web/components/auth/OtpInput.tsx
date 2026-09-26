"use client";

import { useCallback, useRef, type RefObject } from "react";

interface OtpInputProps {
  id: string;
  value: string;
  onChange: (valeur: string) => void;
  label: React.ReactNode;
  longueur?: number;
  /** Change de valeur (message d'erreur) → secousse + cases en rouge. */
  erreur?: string | null;
  describedBy?: string;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  aide?: React.ReactNode;
  delai?: number;
}

/**
 * Code à N chiffres : UN seul vrai champ (autocomplétion SMS/e-mail, collage,
 * clavier numérique, lecteurs d'écran) posé, invisible, par-dessus des cases
 * purement visuelles. L'anneau de focus glisse d'une case à l'autre en
 * transform ; une erreur secoue la rangée. Le curseur est toujours ramené en
 * fin de saisie pour que la case active corresponde au prochain chiffre.
 */
export function OtpInput({
  id,
  value,
  onChange,
  label,
  longueur = 6,
  erreur,
  describedBy,
  autoFocus,
  inputRef,
  aide,
  delai,
}: OtpInputProps) {
  const interne = useRef<HTMLInputElement | null>(null);
  const idAide = `${id}-aide`;

  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      interne.current = el;
      if (inputRef) inputRef.current = el;
    },
    [inputRef],
  );

  function caretEnFin() {
    const el = interne.current;
    if (!el) return;
    const fin = el.value.length;
    if (el.selectionStart !== fin || el.selectionEnd !== fin) el.setSelectionRange(fin, fin);
  }

  const actif = Math.min(value.length, longueur - 1);
  const cases = Array.from({ length: longueur }, (_, i) => i);

  return (
    <div
      className="nkauth-field"
      data-reveal={delai !== undefined ? "" : undefined}
      style={delai !== undefined ? ({ "--d": delai } as React.CSSProperties) : undefined}
    >
      <label htmlFor={id} className="nkauth-label">
        <span>{label}</span>
      </label>
      <div className={`nkauth-otp${erreur ? " is-error is-shake" : ""}`}>
        {/* Les cases sont décoratives : la clé remonte la rangée à chaque
            nouvelle erreur, ce qui relance la secousse sans état React. */}
        <div className="nkauth-otp-boxes" aria-hidden="true" key={erreur ?? "ok"}>
          {cases.map((i) => {
            const chiffre = value[i];
            return (
              <span key={i} className={`nkauth-otp-box${chiffre ? " is-filled" : ""}${i === actif ? " is-active" : ""}`}>
                {chiffre ? <span className="digit" key={`${i}-${chiffre}`}>{chiffre}</span> : <span className="caret" />}
              </span>
            );
          })}
        </div>
        <span className="nkauth-otp-ring" aria-hidden="true" style={{ "--i": actif } as React.CSSProperties} />
        <input
          ref={setRef}
          id={id}
          className="nkauth-otp-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={longueur}
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          required
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, longueur))}
          onFocus={caretEnFin}
          onSelect={caretEnFin}
          onClick={caretEnFin}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={[aide ? idAide : null, describedBy ?? null].filter(Boolean).join(" ") || undefined}
        />
      </div>
      {aide && (
        <p id={idAide} className="nkauth-hint">
          {aide}
        </p>
      )}
    </div>
  );
}
