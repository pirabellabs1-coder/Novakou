import type { ButtonHTMLAttributes } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primary" | "light" | "ghost";
  chargement?: boolean;
  texteChargement?: string;
  /** Icône avant le libellé (logo Google…). */
  icone?: React.ReactNode;
  /** Flèche dans un disque à droite (par défaut sur le bouton primaire). */
  fleche?: boolean;
  delai?: number;
}

/**
 * Bouton « verre » plein-largeur (cf. .btn-glass dans home.css). En
 * chargement : spinner dans le disque, libellé dédié, `aria-busy`.
 */
export function AuthButton({
  variante = "primary",
  chargement = false,
  texteChargement = "Un instant…",
  icone,
  fleche = variante === "primary",
  delai,
  className = "",
  children,
  disabled,
  ...rest
}: AuthButtonProps) {
  const afficherDisque = fleche || chargement;
  return (
    <button
      className={`btn-glass btn-glass--${variante}${chargement ? " is-loading" : ""} ${className}`}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      data-reveal={delai !== undefined ? "" : undefined}
      style={delai !== undefined ? ({ "--d": delai } as React.CSSProperties) : undefined}
      {...rest}
    >
      <span className="lbl">
        {!chargement && icone}
        {chargement ? texteChargement : children}
      </span>
      {afficherDisque && (
        <span className="btn-ico" aria-hidden="true">
          {chargement ? <LoaderCircle className="spin" /> : <ArrowRight />}
        </span>
      )}
    </button>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
