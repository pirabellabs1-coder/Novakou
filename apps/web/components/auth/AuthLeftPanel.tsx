import { Check, ShieldCheck } from "lucide-react";
import { BrandMark } from "./BrandMark";

export interface AuthLeftPanelProps {
  /** Étiquette du portail (« Espace vendeur », « Espace acheteur »…). */
  eyebrow?: string;
  /** Titre éditorial : un tableau = une ligne par entrée (révélées l'une après l'autre). */
  headline?: React.ReactNode | string[];
  subtext?: string;
  /** Trois bénéfices maximum : le panneau doit respirer. */
  benefits?: string[];
  /** Ligne de confiance en pied de panneau. */
  trust?: string;
  /** Couleur de la lueur (rgba) — teintée par le rôle sur l'inscription. */
  glow?: string;
}

const DEFAULT_HEADLINE = ["Vendez vos formations", "et produits numériques"];

const DEFAULT_BENEFITS = [
  "Encaissez en Mobile Money et par carte, en FCFA",
  "Formations, ebooks, produits digitaux : tout au même endroit",
  "Vos ventes et vos gains suivis en temps réel",
];

const DEFAULT_SUBTEXT =
  "Rejoignez les créateurs d’Afrique francophone et de la diaspora qui vendent leurs savoirs sur Novakou.";

/**
 * Panneau gauche des pages d'authentification : vert nuit, typographie forte,
 * trois bénéfices. Sous lg, seule la ligne du haut (marque + portail) reste,
 * en en-tête compact ; le reste est masqué par auth.css.
 */
export function AuthLeftPanel({
  eyebrow = "Espace vendeur",
  headline,
  subtext = DEFAULT_SUBTEXT,
  benefits = DEFAULT_BENEFITS,
  trust = "Paiements sécurisés · Données chiffrées · Support francophone",
  glow,
}: AuthLeftPanelProps) {
  const lignes = headline === undefined ? DEFAULT_HEADLINE : Array.isArray(headline) ? headline : null;

  return (
    <aside className="nkauth-panel" aria-label="Présentation de Novakou">
      <div className="nkauth-panel-bg" aria-hidden="true" />
      <div
        className="nkauth-glow"
        aria-hidden="true"
        style={glow ? ({ "--panel-glow": glow } as React.CSSProperties) : undefined}
      />

      <div className="nkauth-panel-top" data-reveal="fade">
        <BrandMark />
        <span className="nkauth-eyebrow">{eyebrow}</span>
      </div>

      <div className="nkauth-panel-body">
        <p className="nkauth-title">
          {lignes
            ? lignes.map((ligne, i) => (
                <span key={ligne} className="nkauth-line" style={{ "--i": i } as React.CSSProperties}>
                  <span>{ligne}</span>
                </span>
              ))
            : headline}
        </p>
        <p className="nkauth-lead" data-reveal style={{ "--d": 260 } as React.CSSProperties} data-swap-panel>
          {subtext}
        </p>
        <ul className="nkauth-benefits" data-reveal style={{ "--d": 340 } as React.CSSProperties} data-swap-panel>
          {benefits.slice(0, 3).map((b) => (
            <li key={b}>
              <span className="dot" aria-hidden="true">
                <Check strokeWidth={3} />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="nkauth-panel-foot" data-reveal="fade" style={{ "--d": 600 } as React.CSSProperties}>
        <ShieldCheck aria-hidden="true" />
        <span>{trust}</span>
      </div>
    </aside>
  );
}
