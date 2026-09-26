"use client";

import "./auth.css";
import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Store } from "lucide-react";
import { inter, sora } from "@/lib/fonts";
import { AuthLeftPanel, type AuthLeftPanelProps } from "./AuthLeftPanel";
import { useAnimerBascule } from "./motion";

interface AuthShellProps {
  /** Portail affiché — pilote l'étiquette du panneau et le lien croisé. */
  portail: "vendeur" | "acheteur";
  /** Largeur maximale de la colonne formulaire, en px. */
  largeur?: number;
  panneau?: AuthLeftPanelProps;
  /** Change de valeur → les `[data-swap]` de la colonne formulaire rentrent en cascade. */
  cleBascule?: string | number;
  /** Idem pour les `[data-swap-panel]` du panneau gauche. */
  clePanneau?: string | number;
  /** Masque le lien croisé vendeur ↔ acheteur. */
  sansCroise?: boolean;
  trust?: string;
  children: React.ReactNode;
}

const CROISE = {
  vendeur: {
    href: "/acheteur/connexion",
    icone: ShoppingBag,
    titre: "Vous avez acheté sur Novakou ?",
    texte: "Retrouvez vos formations et produits, sans compte vendeur.",
    action: "Mes achats",
  },
  acheteur: {
    href: "/connexion",
    icone: Store,
    titre: "Vous êtes vendeur, mentor ou affilié ?",
    texte: "Connectez-vous à votre espace créateur.",
    action: "Espace vendeur",
  },
} as const;

/**
 * Mise en page « editorial split » commune aux pages d'authentification :
 * panneau vert nuit à gauche (en-tête compact sous lg), carte à droite.
 * Le shell occupe tout l'écran (min-height 100dvh) et porte son propre
 * en-tête (marque + retour à l'accueil) : il ne dépend d'aucun menu ni
 * pied de page. Charge les polices Sora/Inter lui-même : /acheteur/connexion
 * vit hors du layout (formations) et n'en hériterait pas.
 */
export function AuthShell({
  portail,
  largeur = 440,
  panneau,
  cleBascule,
  clePanneau,
  sansCroise = false,
  trust = "Connexion chiffrée · SSL 256 bits",
  children,
}: AuthShellProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useAnimerBascule(mainRef, cleBascule);
  useAnimerBascule(panelRef, clePanneau, "[data-swap-panel]");

  const croise = CROISE[portail];
  const Icone = croise.icone;

  return (
    <div
      className={`nkauth ${inter.variable} ${sora.variable}`}
      style={{ "--nkauth-w": `${largeur}px` } as React.CSSProperties}
    >
      <div ref={panelRef} className="contents">
        <AuthLeftPanel
          eyebrow={portail === "acheteur" ? "Espace acheteur" : "Espace vendeur"}
          {...panneau}
        />
      </div>

      <div ref={mainRef} className="nkauth-main">
        <div className="nkauth-topbar" data-reveal="fade">
          <Link href="/" className="nkauth-back">
            <ArrowLeft aria-hidden="true" />
            Retour à l’accueil
          </Link>
        </div>

        <div className="nkauth-center">
          <div className="nkauth-inner">
          {children}

          {!sansCroise && (
            <Link href={croise.href} className="nkauth-cross" data-reveal style={{ "--d": 420 } as React.CSSProperties}>
              <span className="disc" aria-hidden="true">
                <Icone />
              </span>
              <span className="txt">
                <b>{croise.titre}</b>
                {croise.texte}
              </span>
              <span className="go">
                <span>{croise.action}</span>
                <ArrowRight aria-hidden="true" />
              </span>
            </Link>
          )}

          <p className="nkauth-trust" data-reveal="fade" style={{ "--d": 520 } as React.CSSProperties}>
            <Lock aria-hidden="true" />
            {trust}
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
