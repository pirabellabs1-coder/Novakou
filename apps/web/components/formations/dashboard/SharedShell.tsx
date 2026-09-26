"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { getDashboardForFormationsRole, type FormationsRole } from "@/lib/formations/role-routing";
import { DashboardShell, ShellUserChip, initiales, type ShellSpace } from "./DashboardShell";
import type { ShellNavSection } from "./SidebarNav";
import { sectionsAdmin } from "./nav/admin";
import { SECTIONS_AFFILIE } from "./nav/affilie";
import { sectionsApprenant } from "./nav/apprenant";
import { SECTIONS_MENTOR } from "./nav/mentor";
import { sectionsVendeur } from "./nav/vendeur";

type EspacePartage = {
  space: ShellSpace;
  spaceLabel: string;
  /** Tableau de bord de l'espace : destination de la marque et clé de résolution. */
  homeHref: string;
  sections: ShellNavSection[];
  /** Pastille utilisateur cliquable vers ce profil ; statique sinon. */
  profilHref?: string;
  /** Sous-titre de la pastille ; à défaut, l'e-mail (comme l'administration). */
  sousTitre?: string;
};

// Mêmes libellés, accueils, menus et pastilles que les layouts des espaces.
// Pas de compteurs : ils dépendent de requêtes propres à chaque layout, et
// l'ancienne coque partagée n'en affichait pas non plus.
const APPRENANT: EspacePartage = {
  space: "apprenant",
  spaceLabel: "Espace apprenant",
  homeHref: "/apprenant/dashboard",
  sections: sectionsApprenant(),
  profilHref: "/apprenant/parametres",
  sousTitre: "Client",
};

const ESPACES: EspacePartage[] = [
  {
    space: "vendeur",
    spaceLabel: "Espace vendeur",
    homeHref: "/vendeur/dashboard",
    sections: sectionsVendeur(),
    profilHref: "/vendeur/profil",
    sousTitre: "Vendeur",
  },
  APPRENANT,
  {
    // Habillage apprenant : l'espace mentor est le jumeau de l'espace
    // apprenant (même refonte, même police Manrope, fond blanc) — l'habillage
    // vendeur changerait de typographie en passant de /mentor/* à /messages.
    space: "apprenant",
    spaceLabel: "Espace mentor",
    homeHref: "/mentor/dashboard",
    sections: SECTIONS_MENTOR,
    profilHref: "/mentor/profil",
    sousTitre: "Mentor",
  },
  {
    space: "affilie",
    spaceLabel: "Espace affilié",
    homeHref: "/affilie/dashboard",
    sections: SECTIONS_AFFILIE,
    sousTitre: "Affilié",
  },
  {
    space: "admin",
    spaceLabel: "Administration",
    homeHref: "/admin/dashboard",
    sections: sectionsAdmin(),
  },
];

// Session pas encore lue : une coque sans menu plutôt que le menu d'un autre
// espace qui clignote (l'ancienne coque montrait le menu apprenant à un
// vendeur le temps de charger la session).
const EN_CHARGEMENT: EspacePartage = {
  space: "vendeur",
  spaceLabel: "Mon espace",
  homeHref: "/",
  sections: [],
};

/**
 * L'espace affiché est celui vers lequel lib/formations/role-routing envoie
 * l'utilisateur — admin d'abord, puis formationsRole, puis le rôle
 * marketplace — la règle déjà suivie par RoleGuard et la connexion.
 */
function espaceDe(user: { role?: string; formationsRole?: string }): EspacePartage {
  const accueil = getDashboardForFormationsRole(user.formationsRole as FormationsRole, user.role);
  return ESPACES.find((e) => e.homeHref === accueil) ?? APPRENANT;
}

/**
 * Coque des routes partagées entre espaces (/kyc, /wallet, /messages) : la
 * coque commune avec le menu de l'espace de l'utilisateur, lu dans les mêmes
 * modules nav/* que les layouts — aucune copie à tenir en miroir.
 */
export function SharedShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const user = status === "authenticated" ? session?.user : undefined;
  const espace = user ? espaceDe(user) : EN_CHARGEMENT;

  return (
    <DashboardShell
      space={espace.space}
      spaceLabel={espace.spaceLabel}
      homeHref={espace.homeHref}
      sections={espace.sections}
      topEnd={
        user && (
          <ShellUserChip
            href={espace.profilHref}
            name={user.name ?? "Utilisateur"}
            subtitle={espace.sousTitre ?? user.email}
            src={user.image}
            initials={initiales(user.name, "NK")}
            chevron={!!espace.profilHref}
          />
        )
      }
      sidebarFoot={
        user && (
          <button
            type="button"
            onClick={() => {
              document.cookie = "nk_active_shop=; path=/; max-age=0";
              signOut({ callbackUrl: "/" });
            }}
            className="nkd-btn nkd-btn--danger nkd-btn--block"
          >
            <LogOut aria-hidden="true" />
            Se déconnecter
          </button>
        )
      }
    >
      {children}
    </DashboardShell>
  );
}
