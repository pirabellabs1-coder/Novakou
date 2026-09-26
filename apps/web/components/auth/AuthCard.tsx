import type { LucideIcon } from "lucide-react";

/** Carte double-bezel : coque translucide + cœur blanc à rayons concentriques. */
export function AuthCard({ children, delai = 120 }: { children: React.ReactNode; delai?: number }) {
  return (
    <div className="nkauth-bezel" data-reveal style={{ "--d": delai } as React.CSSProperties}>
      <div className="nkauth-card">{children}</div>
    </div>
  );
}

interface AuthHeadProps {
  titre: React.ReactNode;
  sousTitre?: React.ReactNode;
  icone?: LucideIcon;
  centre?: boolean;
  /** Identifiant du titre (pour aria-labelledby sur le formulaire). */
  id?: string;
  /** Vrai quand le bloc rentre en cascade à chaque bascule (motion.ts) — il
   *  n'a alors pas d'entrée CSS, pour ne pas animer deux fois. */
  swap?: boolean;
}

/** Titre de carte : c'est le h1 de la page (le panneau gauche est décoratif). */
export function AuthHead({ titre, sousTitre, icone: Icone, centre = false, id, swap = false }: AuthHeadProps) {
  return (
    <div
      className={`nkauth-head${centre ? " nkauth-head--center" : ""}`}
      data-reveal={swap ? undefined : ""}
      data-swap={swap ? "" : undefined}
      style={{ "--d": 200 } as React.CSSProperties}
    >
      {Icone && (
        <span className="icon-disc" aria-hidden="true">
          <Icone />
        </span>
      )}
      <h1 id={id}>{titre}</h1>
      {sousTitre && <p>{sousTitre}</p>}
    </div>
  );
}

interface AuthSuccessProps {
  icone: LucideIcon;
  titre: React.ReactNode;
  children?: React.ReactNode;
}

/** Écran de confirmation (e-mail envoyé, mot de passe mis à jour…). */
export function AuthSuccess({ icone: Icone, titre, children }: AuthSuccessProps) {
  return (
    <div className="nkauth-success" role="status" data-swap>
      <span className="disc" aria-hidden="true">
        <Icone />
      </span>
      <h2>{titre}</h2>
      {children}
    </div>
  );
}
