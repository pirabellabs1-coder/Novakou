/**
 * Novakou — Role routing (single source of truth)
 *
 * Given a user's formationsRole, returns their dashboard URL.
 * Used everywhere: inscription, connexion, middleware, navbar, etc.
 */

export type FormationsRole = "apprenant" | "instructeur" | "mentor" | "affilie" | null | undefined;

const DASHBOARDS: Record<string, string> = {
  apprenant: "/apprenant/dashboard",
  instructeur: "/vendeur/dashboard",
  mentor: "/mentor/dashboard",
  affilie: "/affilie/dashboard",
};

export function getDashboardForFormationsRole(
  role: FormationsRole,
  userRole?: string
): string {
  // Admin overrides everything
  if (userRole === "ADMIN" || userRole === "admin") {
    return "/admin/dashboard";
  }
  if (role && DASHBOARDS[role]) {
    return DASHBOARDS[role];
  }
  // No formationsRole yet → fall back to the marketplace `userRole`. Old
  // accounts created before formationsRole existed still have role set, and
  // a vendor with role="freelance" should land on /vendeur/dashboard, not
  // be silently dropped into the apprenant space (which was the bug behind
  // "I logged in via /connexion and ended up in /apprenant").
  if (typeof userRole === "string") {
    const r = userRole.toLowerCase();
    if (r === "freelance" || r === "instructeur" || r === "vendeur") return DASHBOARDS.instructeur;
    if (r === "mentor") return DASHBOARDS.mentor;
    if (r === "affilie" || r === "affiliate") return DASHBOARDS.affilie;
  }
  // No identifying signal at all → apprenant by default (least privileged).
  return "/apprenant/dashboard";
}

export function getRoleLabel(role: FormationsRole): string {
  switch (role) {
    case "instructeur": return "Vendeur";
    case "apprenant": return "Apprenant";
    case "mentor": return "Mentor";
    case "affilie": return "Affilié";
    default: return "Utilisateur";
  }
}

export function getRoleIcon(role: FormationsRole): string {
  switch (role) {
    case "instructeur": return "storefront";
    case "apprenant": return "school";
    case "mentor": return "record_voice_over";
    case "affilie": return "diversity_3";
    default: return "person";
  }
}
